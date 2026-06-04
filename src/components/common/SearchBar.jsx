import React, { useState, useEffect } from 'react';
import { Search, MapPin, User, ChevronRight, Stethoscope, Navigation } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './SearchBar.css';

const SearchBar = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [locationValue, setLocationValue] = useState(searchParams.get('loc') || '');
    const [querySuggestions, setQuerySuggestions] = useState([]);
    const [locationSuggestions, setLocationSuggestions] = useState([]);

    useEffect(() => {
        setQuery(searchParams.get('q') || '');
        setLocationValue(searchParams.get('loc') || '');
    }, [searchParams]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [activeInput, setActiveInput] = useState(null); // 'query' or 'location'

    const fetchSuggestions = async (type, val) => {
        if (val.length < 1) {
            if (type === 'query') setQuerySuggestions([]);
            else setLocationSuggestions([]);
            return;
        }
        try {
            const res = await api.get('/professionnels/suggestions', { params: { type, val } });
            if (type === 'query') setQuerySuggestions(res.data);
            else setLocationSuggestions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query && !locationValue) return;

        setQuerySuggestions([]);
        setLocationSuggestions([]);
        setActiveInput(null);

        const targetPath = (isAuthenticated && user?.role === 'patient') 
            ? '/patient/prendre-rendez-vous' 
            : '/recherche';

        navigate(`${targetPath}?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(locationValue)}`);
    };

    return (
        <div className="search-bar-container">
            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-group">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Nom, spécialité, établissement..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            fetchSuggestions('query', e.target.value);
                        }}
                        onFocus={() => {
                            setActiveInput('query');
                            if (query) fetchSuggestions('query', query);
                        }}
                    />
                    {activeInput === 'query' && querySuggestions.length > 0 && (
                        <div className="suggestion-dropdown">
                            {querySuggestions.map((s, i) => (
                                <div
                                    key={i}
                                    className="suggestion-item"
                                    onClick={() => {
                                        setQuery(s.text);
                                        setQuerySuggestions([]);
                                        setActiveInput(null);
                                    }}
                                >
                                    {s.type === 'specialty' ? <Stethoscope size={16} /> : <User size={16} />}
                                    <span>{s.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="search-divider"></div>

                <div className="search-input-group">
                    <MapPin className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Où ?"
                        value={locationValue}
                        onChange={(e) => {
                            setLocationValue(e.target.value);
                            fetchSuggestions('location', e.target.value);
                        }}
                        onFocus={() => {
                            setActiveInput('location');
                            if (locationValue) fetchSuggestions('location', locationValue);
                        }}
                    />
                    {activeInput === 'location' && (
                        <div className="suggestion-dropdown">
                            <div className="suggestion-item auto-location" onClick={() => {
                                setLocationValue('Autour de moi');
                                setLocationSuggestions([]);
                                setActiveInput(null);
                            }}>
                                <Navigation size={16} className="nav-icon" />
                                <strong>Autour de moi</strong>
                            </div>
                            {locationSuggestions.map((s, i) => (
                                <div
                                    key={i}
                                    className="suggestion-item"
                                    onClick={() => {
                                        setLocationValue(s.text);
                                        setLocationSuggestions([]);
                                        setActiveInput(null);
                                    }}
                                >
                                    <MapPin size={16} />
                                    <span>{s.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" className="search-submit-btn">
                    <span>Rechercher</span>
                    <ChevronRight size={20} />
                </button>
            </form>

        </div>
    );
};

export default SearchBar;
