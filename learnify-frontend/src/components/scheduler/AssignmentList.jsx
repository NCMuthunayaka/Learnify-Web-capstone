import TaskCard from './TaskCard';

const AssignmentList = ({ tasks, onToggle }) => (
  <div className="space-y-3">
    {tasks.map((task) => (
      <TaskCard key={task.id} task={task} onToggle={onToggle} />
    ))}
  </div>
);

export default AssignmentList;
