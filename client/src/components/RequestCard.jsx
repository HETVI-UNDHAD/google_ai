const CATEGORY_COLORS = {
  Food:      'bg-orange-100 text-orange-700 border-orange-200',
  Health:    'bg-red-100 text-red-700 border-red-200',
  Education: 'bg-blue-100 text-blue-700 border-blue-200',
  Shelter:   'bg-green-100 text-green-700 border-green-200',
};

const STATUS_COLORS = {
  Pending:       'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Resolved:      'bg-green-100 text-green-700',
};

const URGENCY_CONFIG = {
  1: { label: 'Low',    color: 'text-green-600',  dot: 'bg-green-500' },
  2: { label: 'Medium', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  3: { label: 'High',   color: 'text-red-600',    dot: 'bg-red-500' },
};

export default function RequestCard({ request }) {
  const { title, description, category, city, area, urgency, peopleAffected, priorityScore, status, imageUrl, submittedBy } = request;
  const urg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG[1];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
      {imageUrl && (
        <img src={`http://localhost:5000${imageUrl}`} alt={title} className="w-full h-36 object-cover" />
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug">{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${CATEGORY_COLORS[category]}`}>
            {category}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>📍 {city}, {area}</span>
          <span>👥 {peopleAffected} affected</span>
          {submittedBy && <span>🏢 {submittedBy.name}</span>}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-1 font-semibold ${urg.color}`}>
            <span className={`w-2 h-2 rounded-full ${urg.dot}`}></span>
            {urg.label} Urgency
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
            {status}
          </span>
          <span className="text-sm font-bold text-indigo-600">Score: {priorityScore}</span>
        </div>
      </div>
    </div>
  );
}
