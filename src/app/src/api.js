// The only module that knows how to talk to the backend.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// The route is registered as 'todos/', so the trailing slash is required.
const TODOS_URL = `${BASE_URL}/todos/`;

async function request(url, options) {
  const response = await fetch(url, options);
  // Our error responses are JSON, but a failure can also come from something in
  // between that returns HTML -- so don't assume the body parses.
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((body && body.error) || `Request failed (${response.status})`);
  }
  return body;
}

export const fetchTodos = () => request(TODOS_URL);

export const createTodo = (description) =>
  request(TODOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });