from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import (
    UserRegistrationView,
    CurrentUserDetailView,
    GoogleLoginView,
    CompleteGoogleProfileView
)

app_name = 'users'

urlpatterns = [
    # Standard JWT Auth
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Current user details
    path('me/', CurrentUserDetailView.as_view(), name='current_user_detail'),

    # Google Sign-In
    path('google/initiate/', GoogleLoginView.as_view(), name='google_login_initiate'), # Handles token from frontend
    path('google/complete-registration/', CompleteGoogleProfileView.as_view(), name='google_complete_registration'), # For new users to add roll number
]
