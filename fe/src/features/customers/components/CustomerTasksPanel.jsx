import PropTypes from 'prop-types';
import { STATUS_CONFIG } from '@/features/tasks/constants';
import useTasks from '@/features/tasks/hooks/useTasks';
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/chadcn/Table';

export default function CustomerTasksPanel({ customer, onClose, onEditTask }) {
  const { data, isLoading } = useTasks({ customerId: customer.id, limit: 100 });
  const tasks = data?.data ?? [];

  return (
    <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800">Tasks for {customer.name}</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
          aria-label="Close tasks panel"
        >
          ×
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          No tasks for this customer yet.
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Task Name</TableHeader>
              <TableHeader>Start</TableHeader>
              <TableHeader>End</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>% Complete</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => {
              const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
              return (
                <TableRow key={task.id} onClick={() => onEditTask(task)}>
                  <TableCell className="font-medium text-slate-800 cursor-pointer">
                    {task.name}
                  </TableCell>
                  <TableCell className="cursor-pointer">{task.startDate ?? '—'}</TableCell>
                  <TableCell className="cursor-pointer">{task.endDate ?? '—'}</TableCell>
                  <TableCell className="cursor-pointer">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badgeClass}`}
                    >
                      {statusCfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="cursor-pointer">{task.percentComplete ?? 0}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

CustomerTasksPanel.propTypes = {
  customer: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
};
