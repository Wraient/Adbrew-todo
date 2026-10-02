from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging, os
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from .services import create_todo, list_todos
from .validation import parse_todo

mongo_uri = 'mongodb://' + os.environ["MONGO_HOST"] + ':' + os.environ["MONGO_PORT"]
db = MongoClient(mongo_uri)['test_db']


class TodoListView(APIView):

    def get(self, request):
        try:
            todos = list_todos(db)
        except PyMongoError:
            logging.exception("GET /todos/ could not reach MongoDB")
            return Response({"error": "Database unavailable"},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"todos": todos}, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            todo = create_todo(db, parse_todo(request.data))
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except PyMongoError:
            logging.exception("POST /todos/ could not reach MongoDB")
            return Response({"error": "Database unavailable"},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(todo, status=status.HTTP_201_CREATED)