from django.contrib import admin
from .models import User, DeviceInfo

# Register your models here.
# Basic registration:
# admin.site.register(User)
# admin.site.register(DeviceInfo)

# For more customized admin views:
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'role', 'is_staff', 'is_active', 'last_login', 'created_at')
    list_filter = ('role', 'is_staff', 'is_active', 'created_at', 'last_login')
    search_fields = ('email', 'name', 'roll_number')
    ordering = ('-created_at',)
    # You might want to exclude password field from direct edit or make it readonly
    # fields = ('email', 'name', 'role', 'roll_number', 'google_id', 'is_active', 'is_staff', 'is_superuser', 'last_login', 'created_at', 'updated_at', 'groups', 'user_permissions') # Example
    # readonly_fields = ('last_login', 'created_at', 'updated_at')

class DeviceInfoAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'ip_address', 'user_agent', 'login_date')
    list_filter = ('login_date', 'ip_address')
    search_fields = ('user__email', 'ip_address', 'user_agent')
    ordering = ('-login_date',)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'


admin.site.register(User, UserAdmin)
admin.site.register(DeviceInfo, DeviceInfoAdmin)
