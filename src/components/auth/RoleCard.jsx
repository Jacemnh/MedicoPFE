import './RoleCard.css';

const RoleCard = ({ role, icon, description, onClick, selected }) => {
  return (
    <div 
      className={`role-card ${selected ? 'role-card-selected' : ''}`}
      onClick={onClick}
    >
      <div className="role-card-icon">{icon}</div>
      <h3 className="role-card-title">{role}</h3>
      <p className="role-card-description">{description}</p>
    </div>
  );
};

export default RoleCard;