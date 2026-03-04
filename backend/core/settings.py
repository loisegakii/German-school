from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

# ─── Base ─────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG      = config('DEBUG', default=False, cast=bool)

DEFAULT_ALLOWED_HOSTS = 'localhost,127.0.0.1,0.0.0.0,.onrender.com'
ALLOWED_HOSTS = [
    h.strip()
    for h in config('ALLOWED_HOSTS', default=DEFAULT_ALLOWED_HOSTS).split(',')
    if h.strip()
]

# ─── Applications ─────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',

    # Our apps
    'lms',
    'payments',
]

# ─── Middleware ────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ─── Database ─────────────────────────────────────────────────────────────────
# On Render: DATABASE_URL contains 'render.com' → use dj_database_url (SSL on)
# Locally:   falls back to individual DB_* variables (no SSL)

database_url = config('DATABASE_URL', default='')

if database_url and 'render.com' in database_url:
    # Production (Render) — SSL required
    DATABASES = {
        'default': dj_database_url.config(
            default=database_url,
            conn_max_age=600,
        )
    }
else:
    # Local development — no SSL
    DATABASES = {
        'default': {
            'ENGINE':   'django.db.backends.postgresql',
            'NAME':     config('DB_NAME', default='deutschpro'),
            'USER':     config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default='1234567'),
            'HOST':     'localhost',
            'PORT':     config('DB_PORT', default='5432'),
        }
    }

# ─── Custom user model ────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'lms.User'

# ─── Password validation ──────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── Internationalisation ─────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

# ─── Static & Media files ─────────────────────────────────────────────────────

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Django REST Framework ────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ─── JWT ──────────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES':      ('Bearer',),
}

# ─── CORS ─────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
]

extra_cors_origins = config('CORS_ALLOWED_ORIGINS', default='')
if extra_cors_origins:
    CORS_ALLOWED_ORIGINS += [
        o.strip() for o in extra_cors_origins.split(',') if o.strip()
    ]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    o for o in CORS_ALLOWED_ORIGINS
    if o.startswith('http://') or o.startswith('https://')
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ─── Security (production only) ───────────────────────────────────────────────

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE   = True
    CSRF_COOKIE_SECURE      = True

# ─── File upload limits ───────────────────────────────────────────────────────

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB

# ─── M-Pesa Daraja Configuration ─────────────────────────────────────────────

MPESA_CONSUMER_KEY        = config('MPESA_CONSUMER_KEY', default='')
MPESA_CONSUMER_SECRET     = config('MPESA_CONSUMER_SECRET', default='')
MPESA_SHORTCODE           = config('MPESA_SHORTCODE', default='')
MPESA_PASSKEY             = config('MPESA_PASSKEY', default='')
MPESA_CALLBACK_URL        = config('MPESA_CALLBACK_URL', default='https://yourdomain.com/api/payments/callback/')
MPESA_ENVIRONMENT         = config('MPESA_ENVIRONMENT', default='sandbox')

MPESA_B2C_INITIATOR_NAME     = config('MPESA_B2C_INITIATOR_NAME', default='')
MPESA_B2C_INITIATOR_PASSWORD = config('MPESA_B2C_INITIATOR_PASSWORD', default='')