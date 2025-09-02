// client/src/components/UserProfile.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './UserProfile.css';

// State and Province Data - Move this to a separate file if it gets too large
const states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
];

const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'YT', label: 'Yukon' },
];

const UserProfile = ({ user, onLogout, onUserUpdate }) => {
    // New state to manage all profile form data, including location
    const [profileFormData, setProfileFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        location: {
            address: '',
            city: '',
            stateProvince: '',
            country: '',
            zipPostalCode: ''
        }
    });

    // State specifically for the Draft.js editor
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const [passwordFormData, setPasswordFormData] = useState({
        oldPassword: '',
        newPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    // Use a useEffect hook to initialize the form data when the user prop changes
    useEffect(() => {
        if (user) {
            setProfileFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userName: user.userName || '',
                email: user.email || '',
                location: {
                    address: user.location?.address || '',
                    city: user.location?.city || '',
                    stateProvince: user.location?.stateProvince || '',
                    country: user.location?.country || '',
                    zipPostalCode: user.location?.zipPostalCode || ''
                }
            });
            // Convert the stringified user bio back to a Draft.js EditorState
            if (user.userBio) {
                try {
                    const contentState = convertFromRaw(JSON.parse(user.userBio));
                    setEditorState(EditorState.createWithContent(contentState));
                } catch (e) {
                    console.error('Failed to parse user bio:', e);
                    setEditorState(EditorState.createEmpty());
                }
            } else {
                setEditorState(EditorState.createEmpty());
            }
        }
    }, [user]);

    // This handler will now manage both top-level and nested state
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        if (['address', 'city', 'stateProvince', 'country', 'zipPostalCode'].includes(name)) {
            // For location fields, update the nested object
            setProfileFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    [name]: value
                }
            }));
        } else {
            // For top-level fields
            setProfileFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
    // Handler for password form
    const handlePasswordChange = (e) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };
    
    // Submit handler for profile updates
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Convert the editor content to a raw JSON object string
        const contentState = editorState.getCurrentContent();
        const rawContent = JSON.stringify(convertToRaw(contentState));

        const updatedFormData = {
            ...profileFormData,
            userBio: rawContent, // Attach the bio to the form data
        };

        try {
            const response = await axios.put('http://localhost:5001/api/profile', updatedFormData, config);
            
            onUserUpdate(response.data);
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    // Submit handler for password updates
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        // ... (rest of password submit logic)
    };

    // Conditional rendering logic for state/province dropdown
    const stateProvinceOptions = profileFormData.location.country === 'USA' ? states :
                                profileFormData.location.country === 'Canada' ? provinces : [];

    return (
        <div className="content">
            <header className="header">
                <h2>{user.role}: {user.firstName} {user.lastName}</h2>
            </header>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <h3>Update Profile Information</h3>
            <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={profileFormData.firstName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={profileFormData.lastName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="userName">User Name</label>
                    <input type="text" id="userName" name="userName" value={profileFormData.userName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={profileFormData.email} onChange={handleProfileChange} />
                </div>

                <hr />

                <div className="form-group">
                    <label htmlFor="userBio">Your Biography</label>
                    <Editor
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        wrapperClassName="bio-editor-wrapper"
                        editorClassName="bio-editor"
                        toolbarClassName="bio-editor-toolbar"
                    />
                </div>

                <hr />

                <h3>Location</h3>
                <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select id="country" name="country" value={profileFormData.location.country} onChange={handleProfileChange}>
                        <option value="">Select a Country</option>
                        <option value="Canada">Canada</option>
                        <option value="USA">USA</option>
                    </select>
                </div>
                
                {profileFormData.location.country && (
                    <>
                        <div className="form-group">
                            <label htmlFor="stateProvince">State/Province</label>
                            <select id="stateProvince" name="stateProvince" value={profileFormData.location.stateProvince} onChange={handleProfileChange}>
                                <option value="">Select a State/Province</option>
                                {stateProvinceOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <input type="text" id="address" name="address" value={profileFormData.location.address} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" value={profileFormData.location.city} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zipPostalCode">Zip/Postal Code</label>
                            <input type="text" id="zipPostalCode" name="zipPostalCode" value={profileFormData.location.zipPostalCode} onChange={handleProfileChange} />
                        </div>
                    </>
                )}

                <button type="submit" className="submit-btn">Update Profile</button>
            </form>

            <hr />

            <h3>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                    <label htmlFor="oldPassword">Old Password</label>
                    <input type="password" id="oldPassword" name="oldPassword" value={passwordFormData.oldPassword} onChange={handlePasswordChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Password</button>
            </form>
        </div>
    );
};

export default UserProfile;