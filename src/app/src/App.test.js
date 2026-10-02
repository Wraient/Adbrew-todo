import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const todo = {
  id: '1',
  description: 'Learn Docker',
  created_at: '2026-10-02T09:00:00Z',
};

function mockFetch(todos) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ todos }),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders the todos returned by the API', async () => {
  mockFetch([todo]);
  render(<App />);
  expect(await screen.findByText('Learn Docker')).toBeInTheDocument();
});

test('creates a todo and refreshes the list', async () => {
  const fetchMock = mockFetch([]);
  render(<App />);
  await screen.findByText(/no todos yet/i);

  fetchMock.mockImplementation((url, options) =>
    options
      ? Promise.resolve({
          ok: true,
          json: () => Promise.resolve(todo),
        })
      : Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ todos: [todo] }),
        })
  );

  userEvent.type(screen.getByLabelText(/todo/i), 'Learn Docker');
  userEvent.click(screen.getByRole('button'));

  await waitFor(() => expect(screen.getByText('Learn Docker')).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:8000/todos/',
    expect.objectContaining({ method: 'POST' })
  );
});

test('surfaces an API error instead of failing silently', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ error: "'description' must not be empty" }),
  });

  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('must not be empty');
});
