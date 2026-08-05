const resources = [
  { id: 1, title: 'React Documentation', type: 'Guide', url: 'https://react.dev' },
  { id: 2, title: 'Flask Documentation', type: 'Guide', url: 'https://flask.palletsprojects.com' },
  { id: 3, title: 'Database Revision Notes', type: 'PDF', url: '#' },
];

const ResourcesPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
      <p className="text-slate-500">Saved learning material for quick access.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {resources.map((resource) => (
        <a key={resource.id} href={resource.url} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300">
          <p className="text-sm font-semibold text-indigo-600">{resource.type}</p>
          <h2 className="mt-2 font-bold text-slate-900">{resource.title}</h2>
        </a>
      ))}
    </div>
  </div>
);

export default ResourcesPage;
