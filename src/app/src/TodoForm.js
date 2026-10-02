export default function TodoForm({ value, onChange, onSubmit, busy }) {
  return (
    <form className="todo-form" onSubmit={onSubmit}>
      <label htmlFor="todo">ToDo: </label>
      <input
        id="todo"
        type="text"
        value={value}
        placeholder="What needs doing?"
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" disabled={busy}>
        {busy ? 'Adding...' : 'Add ToDo!'}
      </button>
    </form>
  );
}