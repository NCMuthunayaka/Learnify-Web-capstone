import Badge from '../common/Badge';

const toneBySentiment = {
  positive: 'green',
  neutral: 'yellow',
  negative: 'red',
};

const SentimentBadge = ({ sentiment = 'neutral' }) => <Badge tone={toneBySentiment[sentiment]}>{sentiment}</Badge>;

export default SentimentBadge;
