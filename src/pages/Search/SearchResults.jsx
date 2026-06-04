import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import SearchBar from '../../components/common/SearchBar';
import { MapPin, Euro, ChevronLeft, ChevronRight, Maximize, Crosshair, FileText } from 'lucide-react';
import api from '../../api/axios';
import './SearchResults.css';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const loc = searchParams.get('loc') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPro, setSelectedPro] = useState(null);
    const [showSlotsPro, setShowSlotsPro] = useState(null);
    const [expandedServices, setExpandedServices] = useState({}); // { proId: boolean }
    const navigate = useNavigate();

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http') || photo.startsWith('/')) return photo;
        return `/storage/${photo}`;
    };

    useEffect(() => {
        fetchResults();
    }, [query, loc]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            const response = await api.get('/professionnels/search', {
                params: { query, location: loc }
            });
            setResults(response.data.data);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (pro, time) => {
        // En vrai, on devrait passer aussi l'heure sélectionnée
        navigate('/patient/prendre-rendez-vous', {
            state: {
                selectedDoctor: {
                    id: pro.id,
                    name: `Dr. ${pro.nom} ${pro.prenom}`,
                    specialty: pro.specialite,
                    location: pro.ville,
                    initials: (pro.nom[0] || '') + (pro.prenom[0] || ''),
                    color: '#8B5CF6'
                },
                selectedTime: time
            }
        });
    };

    // Obtenir la liste des 5 prochains jours pour l'en-tête du tableau
    const getNextDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const nextDays = getNextDays();

    const isPastSlot = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return false;
        const now = new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        return slotDate < now;
    };

    return (
        <div className="search-results-page">
            <div className="sr-top-bar">
                <div className="sr-search-container">
                    {/* On réutilise le composant SearchBar mais on pourrait aussi faire une barre simplifiée */}
                    <SearchBar />
                </div>
            </div>

            <div className="sr-filters-bar">
                <button className="sr-filter-btn">
                    <Crosshair size={16} /> Filtres
                </button>
                <button className="sr-filter-btn">
                    Disponibilités
                </button>
                <button className="sr-filter-btn">
                    <Euro size={16} /> Secteur
                </button>
            </div>

            <div className="sr-main-content">
                <div className="sr-left-column">
                    <div className="sr-header-text">
                        <div className="sr-breadcrumb">
                            <Link to="/">Accueil</Link>
                            <ChevronRight size={14} />
                            <span>Résultats de recherche</span>
                        </div>
                        <h2>{results.length} résultats</h2>
                        <p>
                            Prenez rendez-vous en ligne avec {query || 'un professionnel'} ou des soignants proposant des services similaires
                            {loc ? ` à ${loc}` : ''} ou dans les environs
                        </p>
                    </div>

                    <div className="sr-list">
                        {loading ? (
                            <div className="sr-loading">Recherche en cours...</div>
                        ) : results.length === 0 ? (
                            <div className="sr-no-results">Aucun professionnel trouvé correspondant à vos critères.</div>
                        ) : (
                            results.map((pro) => (
                                <div key={pro.id} className="sr-card">
                                    <div className="sr-card-info">
                                        <div className="sr-pro-header">
                                            <div className="sr-pro-avatar">
                                                {pro.photo ? (
                                                    <img
                                                        src={getPhotoUrl(pro.photo)}
                                                        alt={`Dr. ${pro.nom} ${pro.prenom}`}
                                                        className="pro-photo-img"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className="sr-avatar-placeholder" style={{ display: pro.photo ? 'none' : 'flex' }}>
                                                    {pro.initials || ((pro.nom[0] || '') + (pro.prenom[0] || ''))}
                                                </div>
                                            </div>
                                            <div className="sr-pro-identity">
                                                <h3 onClick={() => setSelectedPro(pro)}>
                                                    Dr. {pro.nom} {pro.prenom}
                                                </h3>
                                                <span className="sr-specialty">{pro.specialite}</span>
                                            </div>
                                        </div>

                                        <div className="sr-pro-details">
                                            <div className="sr-detail-row">
                                                <MapPin size={16} />
                                                <div className="sr-detail-text">
                                                    <div>{pro.adresse || 'Adresse non renseignée'}</div>
                                                    <div>{pro.ville}</div>
                                                </div>
                                            </div>

                                            {/* Services Section */}
                                            {pro.services && pro.services.length > 0 && (
                                                <div className="sr-pro-services">
                                                    <div className="services-title">Actes et tarifs :</div>
                                                    <div className="services-list">
                                                        {(expandedServices[pro.id] ? pro.services : pro.services.slice(0, 3)).map((service, sIndex) => (
                                                            <div key={sIndex} className="service-item">
                                                                <span className="service-name">{service.nom}</span>
                                                                <span className="service-price">{Number(service.prix).toFixed(2)}€</span>
                                                            </div>
                                                        ))}
                                                        {pro.services.length > 3 && (
                                                            <button
                                                                className="service-more-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedServices(prev => ({
                                                                        ...prev,
                                                                        [pro.id]: !prev[pro.id]
                                                                    }));
                                                                }}
                                                            >
                                                                {expandedServices[pro.id] ? 'Voir moins' : `+${pro.services.length - 3} autres services`}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="sr-detail-row sr-convention">
                                                <Euro size={16} />
                                                <span>{(pro.conventionne && !isNaN(pro.conventionne)) ? `${Number(pro.conventionne).toFixed(2)}€` : (pro.conventionne || 'Conventionné')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sr-card-slots">
                                        <button className="sr-nav-btn sr-nav-left">
                                            <ChevronLeft size={20} />
                                        </button>

                                        <div className="sr-slots-grid">
                                            {nextDays.map((date, idx) => {
                                                const dateStr = date.toISOString().split('T')[0];
                                                const daySlots = (pro.prochaines_dispos && pro.prochaines_dispos[dateStr]) || [];
                                                // On n'affiche que les 4 premiers créneaux
                                                const displaySlots = daySlots.slice(0, 4);

                                                return (
                                                    <div key={idx} className="sr-day-column">
                                                        <div className="sr-day-header">
                                                            <strong>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</strong>
                                                            <span>{date.getDate()} {date.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                                        </div>
                                                        <div className="sr-day-slots">
                                                            {displaySlots.length > 0 ? (
                                                                displaySlots.map((slot, sIdx) => {
                                                                    const isPast = isPastSlot(dateStr, slot.time);
                                                                    const isReserved = slot.statut === 'reserve' || slot.statut === 'en_attente';
                                                                    return (
                                                                        <button
                                                                            key={sIdx}
                                                                            className={`sr-time-btn ${isPast || isReserved ? 'is-past' : ''}`}
                                                                            onClick={() => handleBook(pro, slot)}
                                                                            disabled={isPast || isReserved}
                                                                        >
                                                                            {slot.time}
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="sr-no-slots">—</span>
                                                            )}
                                                            {/* Fill empty spots to keep alignment if less than 4 */}
                                                            {displaySlots.length > 0 && displaySlots.length < 4 && (
                                                                Array.from({ length: 4 - displaySlots.length }).map((_, i) => (
                                                                    <div key={`empty-${i}`} className="sr-empty-slot"></div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button className="sr-nav-btn sr-nav-right">
                                            <ChevronRight size={20} />
                                        </button>

                                        <div className="sr-more-slots">
                                            <button onClick={() => setShowSlotsPro(pro)}>Voir plus de créneaux</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="sr-right-column">
                    <div className="sr-map-container">
                        <button className="sr-map-expand">
                            <Maximize size={18} />
                        </button>
                        {/* Placeholder Map - In real word put Leaflet or Google Maps here */}
                        <div className="sr-map-placeholder">
                            <div className="sr-map-overlay">
                                <button className="sr-map-overlay-btn">
                                    <MapPin size={20} />
                                    <span>Explorer la carte</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Détails Professionnel */}
            {selectedPro && (
                <div className="sr-modal-overlay" onClick={() => setSelectedPro(null)}>
                    <div className="sr-modal-content pro-details-modal" onClick={e => e.stopPropagation()}>
                        <button className="sr-modal-close" onClick={() => setSelectedPro(null)}>&times;</button>
                        <div className="modal-body">
                            <div className="modal-pro-header">
                                <div className="modal-pro-avatar">
                                    {selectedPro.photo ? (
                                        <img src={getPhotoUrl(selectedPro.photo)} alt={selectedPro.nom} />
                                    ) : (
                                        <div className="avatar-placeholder">{selectedPro.nom[0]}{selectedPro.prenom[0]}</div>
                                    )}
                                </div>
                                <div className="modal-pro-info">
                                    <h2>Dr. {selectedPro.nom} {selectedPro.prenom}</h2>
                                    <p className="modal-specialty">{selectedPro.specialite}</p>
                                </div>
                            </div>

                            <div className="modal-section">
                                <h3><MapPin size={18} /> Coordonnées</h3>
                                <p>{selectedPro.adresse}</p>
                                <p>{selectedPro.ville}, {selectedPro.code_postal || ''}</p>
                            </div>

                            <div className="modal-section">
                                <h3><FileText size={18} /> À propos</h3>
                                <p>{selectedPro.description || "Ce professionnel n'a pas encore renseigné de description."}</p>
                            </div>

                            <div className="modal-section">
                                <h3><Euro size={18} /> Tarifs et remboursements</h3>
                                <div className="modal-services-list">
                                    {selectedPro.services?.map((s, idx) => (
                                        <div key={idx} className="modal-service-item">
                                            <span>{s.nom}</span>
                                            <span>{Number(s.prix).toFixed(2)}€</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="modal-convention">{(selectedPro.conventionne && !isNaN(selectedPro.conventionne)) ? `${Number(selectedPro.conventionne).toFixed(2)}€` : (selectedPro.conventionne || 'Conventionné Secteur 1')}</p>
                            </div>

                            <button className="modal-book-btn" onClick={() => {
                                handleBook(selectedPro, null);
                                setSelectedPro(null);
                            }}>
                                Prendre rendez-vous
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tous les créneaux */}
            {showSlotsPro && (
                <div className="sr-modal-overlay" onClick={() => setShowSlotsPro(null)}>
                    <div className="sr-modal-content slots-modal" onClick={e => e.stopPropagation()}>
                        <button className="sr-modal-close" onClick={() => setShowSlotsPro(null)}>&times;</button>
                        <div className="modal-header">
                            <h2>Disponibilités de Dr. {showSlotsPro.nom}</h2>
                        </div>
                        <div className="modal-body">
                            <div className="slots-grid-expanded">
                                {/* Affichage de 14 jours par exemple */}
                                {Array.from({ length: 14 }).map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() + i);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const daySlots = (showSlotsPro.prochaines_dispos && showSlotsPro.prochaines_dispos[dateStr]) || [];

                                    return (
                                        <div key={i} className="expanded-day-col">
                                            <div className="day-name">{date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                                            <div className="day-slots-list">
                                                {daySlots.length > 0 ? daySlots.map((slot, sIdx) => {
                                                    const isPast = isPastSlot(dateStr, slot.time);
                                                    const isReserved = slot.statut === 'reserve' || slot.statut === 'en_attente';
                                                    return (
                                                        <button
                                                            key={sIdx}
                                                            className={`slot-btn ${isPast || isReserved ? 'is-past' : ''}`}
                                                            disabled={isPast || isReserved}
                                                            onClick={() => {
                                                                handleBook(showSlotsPro, slot);
                                                                setShowSlotsPro(null);
                                                            }}
                                                        >
                                                            {slot.time}
                                                        </button>
                                                    );
                                                }) : <span className="no-slot">—</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
