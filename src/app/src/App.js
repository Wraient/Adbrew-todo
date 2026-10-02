import { useCallback, useEffect, useState } from 'react';
import './App.css';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { createTodo, fetchTodos } from './api';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const { todos } = await fetchTodos();
      setTodos(todos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createTodo(description);
      setDescription('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="App">
      <h1>List of TODOs</h1>
      {loading ? <p>Loading...</p> : <TodoList todos={todos} />}

      <h1>Create a ToDo</h1>
      <TodoForm
        value={description}
        onChange={setDescription}
        onSubmit={handleSubmit}
        busy={submitting}
      />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}