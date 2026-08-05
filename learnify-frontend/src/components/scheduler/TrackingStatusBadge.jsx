import Badge from '../common/Badge';

const TrackingStatusBadge = ({ active }) => <Badge tone={active ? 'green' : 'gray'}>{active ? 'Tracking' : 'Idle'}</Badge>;

export default TrackingStatusBadge;
