import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

u = User.objects.filter(email=email).first()
if u:
    u.set_password(password)
    u.is_staff = True
    u.is_superuser = True
    u.save()
    print(f'Password reset for {email}')
else:
    print(f'No user found with email {email}')