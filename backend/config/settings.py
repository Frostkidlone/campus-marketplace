
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fupre-campus-marketplace-final-year-2026')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')
INSTALLED_APPS = [
    'django.contrib.admin','django.contrib.auth','django.contrib.contenttypes',
    'django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles',
    'rest_framework','rest_framework_simplejwt','corsheaders',
    'apps.users','apps.products','apps.messaging',
]
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
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.debug','django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages',],},},]
WSGI_APPLICATION = 'config.wsgi.application'

# DATABASE - Render provides DATABASE_URL
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    import urllib.parse as urlparse
    url = urlparse.urlparse(DATABASE_URL)
    DATABASES = {'default': {'ENGINE':'django.db.backends.postgresql','NAME':url.path[1:],'USER':url.username,'PASSWORD':url.password,'HOST':url.hostname,'PORT':url.port or 5432,}}
elif os.getenv('USE_POSTGRES') == '1':
    DATABASES = {'default': {'ENGINE':'django.db.backends.postgresql','NAME':os.getenv('DB_NAME','campus_marketplace'),'USER':os.getenv('DB_USER','postgres'),'PASSWORD':os.getenv('DB_PASSWORD','postgres'),'HOST':os.getenv('DB_HOST','localhost'),'PORT':os.getenv('DB_PORT','5432'),}}
else:
    DATABASES = {'default': {'ENGINE':'django.db.backends.sqlite3','NAME':BASE_DIR / 'db.sqlite3',}}

AUTH_USER_MODEL = 'users.User'
AUTH_PASSWORD_VALIDATORS = [
    {'NAME':'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME':'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME':'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME':'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LANGUAGE_CODE='en-us'
TIME_ZONE='Africa/Lagos'
USE_I18N=True
USE_TZ=True
STATIC_URL='/static/'
STATIC_ROOT=BASE_DIR / 'staticfiles'
STATICFILES_STORAGE='whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL='/media/'
MEDIA_ROOT=BASE_DIR / 'media'
DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
REST_FRAMEWORK={
    'DEFAULT_AUTHENTICATION_CLASSES':('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES':('rest_framework.permissions.IsAuthenticatedOrReadOnly',),
    'DEFAULT_PAGINATION_CLASS':'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE':20,
}
SIMPLE_JWT={'ACCESS_TOKEN_LIFETIME':timedelta(days=1),'REFRESH_TOKEN_LIFETIME':timedelta(days=7),}
CORS_ALLOW_ALL_ORIGINS=True
CORS_ALLOW_CREDENTIALS=True
