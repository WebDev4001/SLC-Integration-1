from rest_framework import serializers
from .models import User # Assuming User model is in the same app (users/models.py)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'password2', 'role', 'roll_number')
        extra_kwargs = {
            'role': {'required': False}, # Default is 'viewer' in model
            'roll_number': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

    def validate_role(self, value):
        # Ensure role is one of the choices defined in the User model
        if value and value not in [choice[0] for choice in User.ROLE_CHOICES]:
            raise serializers.ValidationError(f"Invalid role '{value}'. Valid roles are: {[choice[0] for choice in User.ROLE_CHOICES]}.")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password2'): # Use .get() for safety
            raise serializers.ValidationError({"password2": "Password fields didn't match."})

        roll_number = attrs.get('roll_number')
        if roll_number: # Only validate if provided
            try:
                User.ROLL_NUMBER_VALIDATOR(roll_number) # Use the validator from the model
            except DjangoValidationError as e:
                raise serializers.ValidationError({"roll_number": list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2', None) # Remove password2 before creating user

        # Get role, defaulting to model's default if not provided
        role = validated_data.get('role', User._meta.get_field('role').get_default())

        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data.get('password'), # create_user handles hashing
            role=role,
            roll_number=validated_data.get('roll_number')
        )
        return user

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for general User information (read-only for non-admins).
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'roll_number', 'google_id', 'is_active', 'created_at', 'updated_at', 'last_login')
        read_only_fields = fields # All fields are read-only

class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin to manage users - allows role and other field updates.
    """
    class Meta:
        model = User
        fields = (
            'id', 'email', 'name', 'role', 'roll_number', 'google_id',
            'is_active', 'is_staff', 'last_login', 'created_at', 'updated_at'
        )
        # Admin cannot change email or google_id directly via this serializer once set.
        # Password changes should go through a separate mechanism (e.g., set_password).
        read_only_fields = ('id', 'email', 'google_id', 'last_login', 'created_at', 'updated_at')

    def validate_role(self, value):
        if value not in [choice[0] for choice in User.ROLE_CHOICES]:
            raise serializers.ValidationError(f"Invalid role '{value}'. Valid roles are: {[choice[0] for choice in User.ROLE_CHOICES]}.")
        return value

    def validate_roll_number(self, value):
        if value: # Only validate if provided
            try:
                User.ROLL_NUMBER_VALIDATOR(value)
            except DjangoValidationError as e:
                raise serializers.ValidationError(list(e.messages))
        return value

# --- Google Sign-In Serializers ---

class GoogleSignInTokenSerializer(serializers.Serializer):
    """
    Serializer for receiving the Google ID token from the frontend.
    """
    id_token = serializers.CharField(write_only=True)


class CompleteGoogleUserProfileSerializer(serializers.Serializer):
    """
    Serializer for new Google users to submit their roll number and complete registration.
    Frontend should send email, name, google_id (obtained from the /google-signin/ step response)
    along with the user-provided roll_number.
    """
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    google_id = serializers.CharField(max_length=255)
    roll_number = serializers.CharField(max_length=10, validators=[User.ROLL_NUMBER_VALIDATOR])

    def validate_email(self, value):
        # Ensure the email isn't already tied to a *different* Google account or a local account.
        existing_user = User.objects.filter(email=value).first()
        if existing_user:
            if existing_user.google_id and existing_user.google_id != self.initial_data.get('google_id'):
                raise serializers.ValidationError("This email is already associated with a different Google account.")
            if not existing_user.google_id: # Email exists as a local account
                raise serializers.ValidationError(
                    "This email is already registered as a local account. "
                    "Please log in with your password or link your Google account via profile settings (linking not yet implemented)."
                )
        return value

    def validate_roll_number(self, value):
        # Model validator User.ROLL_NUMBER_VALIDATOR is already on the field.
        # Check for uniqueness.
        if value and User.objects.filter(roll_number=value).exists():
            raise serializers.ValidationError("This Roll Number is already registered.")
        return value

    def validate_google_id(self, value):
        # Ensure this google_id isn't already registered.
        if User.objects.filter(google_id=value).exists():
            raise serializers.ValidationError("This Google account is already registered.")
        return value

    def create(self, validated_data):
        # Create a new user with Google details and roll number.
        # The UserManager's create_user method will set an unusable password
        # because google_id is provided and no password is given.
        user = User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            google_id=validated_data['google_id'],
            roll_number=validated_data['roll_number'],
            role='viewer' # Default role for new Google users
        )
        return user
