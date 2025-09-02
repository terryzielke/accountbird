// client/src/components/AdminUserDetail.jsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './AdminUserDetail.css';

// State and Province Data - for dynamic dropdowns
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

const AdminUserDetail = ({ user, onBack, onLogout, onUserDeleted, onUserUpdated }) => {
    // The `userData` state has been removed. The `user` prop from the parent is the source of truth.
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        role: '',
        status: '',
        location: {
            address: '',
            city: '',
            stateProvince: '',
            country: '',
            zipPostalCode: ''
        }
    });

    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const [passwordFormData, setPasswordFormData] = useState({
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

    // Initialize formData when the user prop changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                userName: user.userName || '',
                email: user.email || '',
                role: user.role || '',
                status: user.status || '',
                location: {
                    address: user.location?.address || '',
                    city: user.location?.city || '',
                    stateProvince: user.location?.stateProvince || '',
                    country: user.location?.country || '',
                    zipPostalCode: user.location?.zipPostalCode || ''
                }
            });
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

    // Handle both top-level and nested field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['address', 'city', 'stateProvince', 'country', 'zipPostalCode'].includes(name)) {
            setFormData(prev => ({
                ...prev,
                location: {
                    ...prev.location,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        const contentState = editorState.getCurrentContent();
        const rawContent = JSON.stringify(convertToRaw(contentState));

        const updatedFormData = { ...formData, userBio: rawContent };

        const locationToSend = {};
        if (updatedFormData.location.address) {
            locationToSend.address = updatedFormData.location.address;
        }
        if (updatedFormData.location.city) {
            locationToSend.city = updatedFormData.location.city;
        }
        if (updatedFormData.location.stateProvince) {
            locationToSend.stateProvince = updatedFormData.location.stateProvince;
        }
        if (updatedFormData.location.country) {
            locationToSend.country = updatedFormData.location.country;
        }
        if (updatedFormData.location.zipPostalCode) {
            locationToSend.zipPostalCode = updatedFormData.location.zipPostalCode;
        }

        if (Object.keys(locationToSend).length > 0) {
            updatedFormData.location = locationToSend;
        } else {
            delete updatedFormData.location;
        }

        try {
            const response = await axios.put(`http://localhost:5001/api/admin/users/${user._id}`, updatedFormData, config);
            
            onUserUpdated(response.data);

            setMessage('User updated successfully! ✅');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user. ❌');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = {
                status: formData.status,
            };
            const response = await axios.put(`http://localhost:5001/api/admin/users/${user._id}/status`, body, config);
            // Update the user state in the parent via callback
            onUserUpdated(prevData => ({ ...prevData, status: formData.status }));
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user status.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = {
                newPassword: passwordFormData.newPassword,
            };
            await axios.put(`http://localhost:5001/api/admin/users/${user._id}/password`, body, config);
            setMessage('User password updated successfully!');
            setPasswordFormData({ newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the password.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/users/${user._id}`, config);
                onUserDeleted();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    const isRegularUser = user.role !== 'admin';

    // Conditional rendering logic for state/province dropdown
    const stateProvinceOptions = formData.location.country === 'USA' ? states :
                                formData.location.country === 'Canada' ? provinces : [];

    return (
        <div className="section">
            <header className="header">
                <h2>User: {user.firstName} {user.lastName}</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleUpdate}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="userName">Username</label>
                    <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>

                <hr/>

                <h4>User Bio</h4>
                <div className="form-group">
                    <Editor
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        wrapperClassName="bio-editor-wrapper"
                        editorClassName="bio-editor"
                        toolbarClassName="bio-editor-toolbar"
                    />
                </div>
                
                <hr/>

                <h4>Location</h4>
                <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <select id="country" name="country" value={formData.location.country} onChange={handleChange}>
                        <option value="">Select a Country</option>
                        <option value="Canada">Canada</option>
                        <option value="USA">USA</option>
                    </select>
                </div>
                {formData.location.country && (
                    <>
                        <div className="form-group">
                            <label htmlFor="stateProvince">State/Province</label>
                            <select id="stateProvince" name="stateProvince" value={formData.location.stateProvince} onChange={handleChange}>
                                <option value="">Select a State/Province</option>
                                {stateProvinceOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <input type="text" id="address" name="address" value={formData.location.address} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">City</label>
                            <input type="text" id="city" name="city" value={formData.location.city} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zipPostalCode">Zip/Postal Code</label>
                            <input type="text" id="zipPostalCode" name="zipPostalCode" value={formData.location.zipPostalCode} onChange={handleChange} />
                        </div>
                    </>
                )}
                <button type="submit" className="submit-btn">Update User</button>
            </form>

            {isRegularUser && (
                <>
                    <hr/>
                    <form onSubmit={handleStatusUpdate}>
                        <div className="form-group">
                            <label htmlFor="status">User Status</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange}>
                                <option value="Active">Active</option>
                                <option value="Deactivated">Deactivated</option>
                            </select>
                        </div>
                        <button type="submit" className="submit-btn">Update Status</button>
                    </form>
                </>
            )}

            <hr/>

            <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                    <label htmlFor="newPassword">Change Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Password</button>
            </form>
            <button onClick={handleDeleteUser} className="delete-btn">Delete User</button>
        </div>
    );
};

export default AdminUserDetail;