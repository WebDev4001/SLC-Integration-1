from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        """
        Creates and saves a User with the given email, name, and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)

        # Ensure role is valid if provided, otherwise it will use default
        role = extra_fields.pop('role', 'viewer')
        if role not in [r[0] for r in User.ROLE_CHOICES]:
            raise ValueError(f"Invalid role: {role}. Must be one of {[r[0] for r in User.ROLE_CHOICES]}.")

        user = self.model(email=email, name=name, role=role, **extra_fields)

        if password:
            user.set_password(password)
        else:
            # If no password (e.g. Google Sign-In), set an unusable one
            # Or ensure password field in model is nullable and handle accordingly
            if not extra_fields.get('google_id'): # Only set unusable if not a Google user without password
                 user.set_unusable_password()


        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email, name, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin') # Superusers are always admins

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if extra_fields.get('role') != 'admin':
            raise ValueError('Superuser role must be "admin".')

        return self.create_user(email, name, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('admin', 'Admin'),
    ]
    ROLL_NUMBER_VALIDATOR = RegexValidator(
        regex=r'^20\d{7}$',
        message="Roll number must be in the format 20XXXXXXX (e.g., 201234567)."
    )

    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True,
    )
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='viewer')

    roll_number = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        validators=[ROLL_NUMBER_VALIDATOR]
    )
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # True for users who can access the Django admin site

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # last_login is provided by AbstractBaseUser

    objects = UserManager()

    USERNAME_FIELD = 'email' # Use email as the unique identifier for login
    REQUIRED_FIELDS = ['name'] # Fields required when creating a user via createsuperuser

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name

    # Note: Password field is inherited from AbstractBaseUser.
    # It's nullable by default in AbstractBaseUser if password=None is passed to set_password or set_unusable_password is used.
    # For Google users, we typically call set_unusable_password() if they register via Google and don't set a local password.

class DeviceInfo(models.Model):
    user = models.ForeignKey(User, related_name='device_info_entries', on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    login_date = models.DateTimeField(default=timezone.now) # Use timezone.now for default

    class Meta:
        ordering = ['-login_date']
        verbose_name_plural = "Device Info Entries"

    def __str__(self):
        return f"{self.user.email} - {self.ip_address or 'Unknown IP'} on {self.login_date.strftime('%Y-%m-%d %H:%M')}"

    # Logic to cap entries at 5 per user will be handled in the view/service
    # that creates DeviceInfo entries. Example:
    # device_infos = user.device_info_entries.all()
    # if device_infos.count() >= 5:
    #     device_infos.last().delete() # Assumes ordering = ['-login_date'] to delete oldest
    # DeviceInfo.objects.create(user=user, ip_address=ip, user_agent=ua)
