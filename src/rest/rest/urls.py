"""rest URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from .views import TodoListView

urlpatterns = [
    path('todos/', TodoListView.as_view(), name='todos'),
    # Also accept the slashless form. APPEND_SLASH can 301 a GET to the
    # canonical URL, but it cannot redirect a POST without dropping the request
    # body, so /todos would otherwise fail outright.
    path('todos', TodoListView.as_view(), name='todos-no-slash'),
]
