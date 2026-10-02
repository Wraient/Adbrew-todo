export default function TodoList({ todos }) {
  if (todos.length === 0) {
    return <p className="empty">No TODOs yet. Add one above.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id}>
          <span className="todo-description">{todo.description}</span>
          <time className="todo-created" dateTime={todo.created_at}>
            {new Date(todo.created_at).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}