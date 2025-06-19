from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken # For manual token generation
from .serializers import (
    UserRegistrationSerializer,
    UserDetailSerializer,
    GoogleSignInTokenSerializer,
    CompleteGoogleProfileSerializer
)
from .models import User, DeviceInfo
from .utils import get_client_ip # Assuming utils.py is in the same app directory

import requests # For calling Google's tokeninfo endpoint
from django.conf import settings # To get GOOGLE_CLIENT_ID
import logging

logger = logging.getLogger(__name__) # For logging server-side events

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all() # Not strictly necessary for CreateAPIView but good practice
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Anyone should be able to register

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save() # This calls serializer.create()

            # Generate JWT tokens for the new user
            refresh = RefreshToken.for_user(user)

            # Log device info on registration
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            if ip_address: # user_agent can be empty string
                DeviceInfo.objects.create(user=user, ip_address=ip_address, user_agent=user_agent or '')
                # Cap device info entries
                entries = DeviceInfo.objects.filter(user=user).order_by('-login_date')
                if entries.count() > 5:
                    entries.last().delete() # Deletes the oldest one due to ordering

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserDetailSerializer(user, context=self.get_serializer_context()).data
            }, status=status.HTTP_201_CREATED)
        logger.warning(f"User registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserDetailView(generics.RetrieveAPIView):
    """
    Returns details for the currently authenticated user.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class GoogleLoginView(views.APIView):
    """
    Handles Google Sign-In.
    Receives an id_token from frontend, verifies it with Google.
    If user exists, logs them in. If new, returns data to prompt for roll number.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = GoogleSignInTokenSerializer # Validates 'id_token' field

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        id_token = serializer.validated_data['id_token']

        try:
            # Verify the ID token with Google's tokeninfo endpoint
            validation_url = f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={id_token}"
            response = requests.get(validation_url, timeout=5) # Added timeout
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            google_user_data = response.json()

            # Validate audience (aud claim) - CRITICAL security check
            if settings.GOOGLE_CLIENT_ID and google_user_data.get('aud') != settings.GOOGLE_CLIENT_ID:
                logger.warning(f"Google token audience mismatch. Expected: {settings.GOOGLE_CLIENT_ID}, Got: {google_user_data.get('aud')}")
                return Response({'error': 'Invalid token: Audience mismatch. Please ensure GOOGLE_CLIENT_ID is correctly configured on the backend.'}, status=status.HTTP_401_UNAUTHORIZED)

            email = google_user_data.get('email')
            google_id = google_user_data.get('sub') # Google's unique user ID
            name = google_user_data.get('name', email.split('@')[0] if email else 'User') # Fallback for name

            if not email or not google_id:
                logger.error("Email or Google ID (sub) missing from Google token response.")
                return Response({'error': 'Email or Google ID missing from token data.'}, status=status.HTTP_400_BAD_REQUEST)

            # Attempt to find user by google_id first
            user = User.objects.filter(google_id=google_id).first()

            if not user: # If no user with this google_id, check by email
                user_by_email = User.objects.filter(email=email).first()
                if user_by_email: # Email exists
                    if not user_by_email.google_id: # This is a local account, link it to Google
                        user_by_email.google_id = google_id
                        if user_by_email.name != name and name: # Update name if different from Google profile
                             user_by_email.name = name
                        # Potentially clear password if it becomes Google-only, or mark as verified differently
                        # user_by_email.set_unusable_password() # If they should only use Google henceforth
                        user_by_email.save()
                        user = user_by_email
                        logger.info(f"Linked existing local account {email} with new Google ID {google_id}")
                    else: # Email is tied to a DIFFERENT google_id. This is a conflict.
                        logger.warning(f"Login attempt for {email} with Google ID {google_id}, but email is already linked to Google ID {user_by_email.google_id}")
                        return Response({'error': 'This email is already associated with a different Google account.'}, status=status.HTTP_409_CONFLICT)
                else: # Truly new user, not found by google_id or email
                    logger.info(f"New Google user detected: {email}. Prompting for roll number.")
                    return Response({
                        'is_new_user': True,
                        'email': email,
                        'name': name,
                        'google_id': google_id # Send this back to client
                    }, status=status.HTTP_200_OK) # 200 OK is fine for this intermediate step

            # Existing user (found by google_id or linked by email) - log them in
            refresh = RefreshToken.for_user(user)

            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            if ip_address:
                DeviceInfo.objects.create(user=user, ip_address=ip_address, user_agent=user_agent or '')
                entries = DeviceInfo.objects.filter(user=user).order_by('-login_date')
                if entries.count() > 5: # Cap device info
                    entries.last().delete()

            logger.info(f"User {user.email} logged in successfully via Google.")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserDetailSerializer(user).data
            }, status=status.HTTP_200_OK)

        except requests.exceptions.HTTPError as e:
            error_details = "Invalid Google token or communication error with Google."
            if e.response is not None:
                try:
                    error_content = e.response.json()
                    error_details = error_content.get('error_description', error_content.get('error', error_details))
                except ValueError: # JSONDecodeError
                    pass
            logger.error(f"Google token verification HTTPError: {e} - Details: {error_details}")
            return Response({'error': error_details}, status=status.HTTP_401_UNAUTHORIZED)
        except requests.exceptions.RequestException as e: # Catch other requests errors like timeout
            logger.error(f"Google token verification RequestException: {e}")
            return Response({'error': 'Could not connect to Google to verify token.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.exception(f"Unexpected error during Google Sign-In for token (first 20 chars): {id_token[:20]}...")
            return Response({'error': 'An unexpected server error occurred during Google Sign-In.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CompleteGoogleProfileView(generics.CreateAPIView):
    """
    Creates a new user account after Google Sign-In if they are new
    and have provided their roll number.
    """
    queryset = User.objects.all()
    serializer_class = CompleteGoogleProfileSerializer
    permission_classes = [permissions.AllowAny] # Security is that they must provide valid data from /google-login/ step

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save() # This calls serializer's create method

            refresh = RefreshToken.for_user(user)

            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            if ip_address: # First login for this user via this flow
                DeviceInfo.objects.create(user=user, ip_address=ip_address, user_agent=user_agent or '')
                # Capping logic (should be first entry, so count will be 1)
                entries = DeviceInfo.objects.filter(user=user).order_by('-login_date')
                if entries.count() > 5:
                    entries.last().delete()

            logger.info(f"New Google user profile completed for {user.email} with roll number {user.roll_number}")
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserDetailSerializer(user, context=self.get_serializer_context()).data
            }, status=status.HTTP_201_CREATED)
        logger.warning(f"CompleteGoogleProfileView validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
