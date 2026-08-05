const Avatar = ({ name = 'User', src }) => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    <img className="h-10 w-10 rounded-full object-cover" src={src} alt={name} />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
      {initials}
    </div>
  );
};

export default Avatar;
