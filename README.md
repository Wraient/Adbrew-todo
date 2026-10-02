# TODO

A to-do list that runs entirely in Docker: a React front end, a Django API, and
MongoDB. Clone it, run two commands, open a browser.

![screenshot](docs/todo.png)

## What it does

- **Add a to-do.** A text box and a button. Submitting sends it to the API and
  clears the box.
- **List them, newest last.** The list comes from the database on every load, so
  whatever you reload is what was actually saved.
- **Refreshes without a page reload.** Adding a to-do re-fetches the list from
  the API rather than guessing at what it saved.
- **Tells you when something is wrong.** Empty input, a too-long to-do, or an
  unreachable database each produce a specific message instead of failing
  quietly.

## How it works

Three containers on one Docker network:

| Container | Port | What runs |
|---|---|---|
| `app` | 3000 | React dev server (create-react-app) |
| `api` | 8000 | Django + Django REST Framework |
| `mongo` | 27017 | MongoDB 7 |

They find each other by service name: the API reads `mongo` from the
environment, Docker's DNS resolves it to the database container's IP.

### The code

```
docker-compose.yml          the three services
Dockerfile                  builds the image all three share
src/rest/rest/views.py      HTTP: parse, delegate, respond
src/rest/rest/services.py   Mongo: every read and write
src/rest/rest/validation.py input rules
src/app/src/App.js          state; holds no URLs
src/app/src/api.js          the only file that knows the API's address
src/app/src/TodoForm.js     form
src/app/src/TodoList.js     list
```

The dividing line is deliberate: `views.py` deals in HTTP, `services.py` deals
in Mongo, and `validation.py` deals in bad input. `services.py` is the only
Python file that imports `pymongo`; `api.js` is the only JavaScript file that
knows the backend exists. Swap either one and you touch a single file.

### A to-do, end to end

1. You submit. `App.js` calls `createTodo()` from `api.js`.
2. `api.js` `POST`s JSON to `/todos/`. One helper handles every request, so no
   component ever looks at a status code — it either resolves or throws.
3. Django hands the body to `validation.py`. Bad input returns `400` with a
   message naming the problem.
4. Good input goes to `services.py`, which writes `{_id, description,
   created_at}` to Mongo and returns the new document.
5. `App.js` re-fetches the list and re-renders.

Documents are stored with native Mongo types — an `ObjectId` and a UTC date.
`services.py` converts both to plain JSON on the way out, so nothing
Mongo-specific reaches the browser.

### Notes on the pinned versions

The image pins MongoDB 7.0, Node 16, and Python 3.8. Each is deliberate:

- **MongoDB 7.0** — MongoDB 4.4 is no longer published for Debian bookworm,
  which is this image's base.
- **Node 16** — create-react-app 4 does not support Node 18, and installing Node
  this way pins the version deliberately rather than inheriting whatever the
  distro ships. On Node 18 this toolchain fails twice: webpack 4 hashes with
  md4, which OpenSSL 3 moved to its legacy provider, and `postcss` exports its
  subpaths in a form Node 17 stopped accepting.
- **A C toolchain** — six packages in `requirements.txt` ship no prebuilt wheel
  and are compiled during the image build.

`requirements.txt` pins every version exactly, so a rebuild years from now
produces the same environment.

## Getting started

You need Docker with Compose v2. Nothing else — no Python, Node, or MongoDB on
your machine.

```bash
git clone https://github.com/Wraient/Adbrew-todo.git
cd Adbrew-todo
export CODE_PATH="$PWD/src"

docker compose build
docker compose up -d
```

Then open **http://localhost:3000**.

The first build takes about ten minutes; later builds take seconds. Six
packages compile from source, and the frontend installs its dependencies on
first start, so give `app` a couple of minutes before expecting a page.

```bash
docker compose ps              # what is running
docker compose logs -f api     # follow the API
docker compose logs -f app     # follow the frontend
docker compose down            # stop everything
docker compose down -v         # stop, and delete the database
```

Your code is mounted into the containers, so edits on disk reload without a
rebuild.

## API

Both forms work: `/todos/` and `/todos`.

### `GET /todos/`

```json
{
  "todos": [
    {
      "id": "6abfa88e41f63ad3639e1bb2",
      "description": "Learn Docker",
      "created_at": "2026-10-02T12:50:22.191626Z"
    }
  ]
}
```

### `POST /todos/`

```json
{ "description": "Learn Docker" }
```

`201` with the created to-do. `400` with `{"error": "..."}` if `description` is
missing, not a string, empty or whitespace-only, or longer than 280 characters.
`503` if MongoDB cannot be reached.

## Tests

```bash
cd src/app && yarn test
```

Covers rendering the API response, creating a to-do and refreshing the list, and
surfacing an API error to the user.

## Troubleshooting

**A container exited, or `docker compose ps` shows `Exit`.**
`docker compose logs <name>` — `app`, `api`, or `mongo`.

**`${CODE_PATH}` is empty and the containers start with no source in them.**
Export it before running compose: `export CODE_PATH="$PWD/src"`.

**`api` returns `503` on every request.**
Mongo isn't up yet, or it crashed. `docker compose logs mongo`.

**The `app` container exits with `digital envelope routines::unsupported` or
`ERR_PACKAGE_PATH_NOT_EXPORTED`.**
It's running an unsupported Node. `docker compose run --rm app node --version`
should print `v16.x`. If not, the image predates the Node pin — rebuild it with
`docker compose build --no-cache app`.

**The build fails with `no permission to read from .../src/db`.**
Something outside Docker is writing to the database directory. Check that
`.dockerignore` is present and lists `src/db`.

**`mongo` won't start: `/data/db` is not empty or not writable.**
The directory must exist on the host: `mkdir -p src/db src/tmp`. Both are
git-ignored, so a fresh clone needs them created once.

**Port already allocated.**
`ss -lptn 'sport = :3000'` to find whoever has it, then stop that process.
