import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './AdminEmailSettings.css';

const AdminEmailSettings = ({ onLogout }) => {
    // State to hold and manage form data
    const [formData, setFormData] = useState({
        emailHost: '',
        emailPort: '',
        emailUser: '',
        emailPass: '',
    });
    // State for the WYSIWYG editors
    const [editorStates, setEditorStates] = useState({
        registrationEmail: EditorState.createEmpty(),
        accountStatusChanged: EditorState.createEmpty(),
        subscriptionTypeChanged: EditorState.createEmpty(),
        userAddedToAccount: EditorState.createEmpty(),
        userRemovedFromAccount: EditorState.createEmpty(),
    });
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const fetchEmailSettings = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            const { emailSettings, emailTemplates } = response.data;

            // Function to convert HTML to EditorState
            const getEditorStateFromHtml = (html) => {
                const contentBlock = htmlToDraft(html);
                if (contentBlock) {
                    const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                    return EditorState.createWithContent(contentState);
                }
                return EditorState.createEmpty();
            };
            
            // Set editor states from fetched HTML content
            setEditorStates({
                registrationEmail: getEditorStateFromHtml(emailTemplates.registrationEmail || ''),
                accountStatusChanged: getEditorStateFromHtml(emailTemplates.accountStatusChanged || ''),
                subscriptionTypeChanged: getEditorStateFromHtml(emailTemplates.subscriptionTypeChanged || ''),
                userAddedToAccount: getEditorStateFromHtml(emailTemplates.userAddedToAccount || ''),
                userRemovedFromAccount: getEditorStateFromHtml(emailTemplates.userRemovedFromAccount || ''),
            });
            
            setFormData({
                emailHost: emailSettings.host || '',
                emailPort: emailSettings.port || '',
                emailUser: emailSettings.user || '',
                emailPass: emailSettings.pass || '',
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching email settings:', err);
            setError(err.response?.data?.msg || 'Failed to fetch email settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    useEffect(() => {
        fetchEmailSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditorStateChange = (editorKey) => (editorState) => {
        setEditorStates({ ...editorStates, [editorKey]: editorState });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        // Convert editor content to HTML for all templates
        const dataToSend = {
            ...formData,
            registrationEmailHtml: draftToHtml(convertToRaw(editorStates.registrationEmail.getCurrentContent())),
            accountStatusChangedHtml: draftToHtml(convertToRaw(editorStates.accountStatusChanged.getCurrentContent())),
            subscriptionTypeChangedHtml: draftToHtml(convertToRaw(editorStates.subscriptionTypeChanged.getCurrentContent())),
            userAddedToAccountHtml: draftToHtml(convertToRaw(editorStates.userAddedToAccount.getCurrentContent())),
            userRemovedFromAccountHtml: draftToHtml(convertToRaw(editorStates.userRemovedFromAccount.getCurrentContent())),
        };

        try {
            const response = await axios.put('http://localhost:5001/api/admin/settings/email', dataToSend, config);
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading email settings...</div>;
    }

    return (
        <div className="content">
            <header className='header'>
                <h2>Email Settings</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                    <h3>SMTP Settings</h3>
                    <div className="form-group">
                        <label htmlFor="emailHost">SMTP Host</label>
                        <input type="text" id="emailHost" name="emailHost" value={formData.emailHost} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailPort">SMTP Port</label>
                        <input type="number" id="emailPort" name="emailPort" value={formData.emailPort} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailUser">SMTP Username</label>
                        <input type="text" id="emailUser" name="emailUser" value={formData.emailUser} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailPass">SMTP Password</label>
                        <input type="password" id="emailPass" name="emailPass" value={formData.emailPass} onChange={handleChange} />
                    </div>

                    <hr />

                    <h2>Email Templates</h2>
                    <div className="form-group">
                        <h3 htmlFor="registrationEmailHtml">Registration Email HTML</h3>
                        <div className="wysiwyg-editor-container">
                            <Editor
                                editorState={editorStates.registrationEmail}
                                onEditorStateChange={handleEditorStateChange('registrationEmail')}
                                wrapperClassName="wysiwyg-wrapper"
                                editorClassName="wysiwyg-editor"
                                toolbarClassName="wysiwyg-toolbar"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <h3 htmlFor="accountStatusChanged">Account Status Changed</h3>
                        <div className="wysiwyg-editor-container">
                            <Editor
                                editorState={editorStates.accountStatusChanged}
                                onEditorStateChange={handleEditorStateChange('accountStatusChanged')}
                                wrapperClassName="wysiwyg-wrapper"
                                editorClassName="wysiwyg-editor"
                                toolbarClassName="wysiwyg-toolbar"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <h3 htmlFor="subscriptionTypeChanged">Subscription Type Changed</h3>
                        <div className="wysiwyg-editor-container">
                            <Editor
                                editorState={editorStates.subscriptionTypeChanged}
                                onEditorStateChange={handleEditorStateChange('subscriptionTypeChanged')}
                                wrapperClassName="wysiwyg-wrapper"
                                editorClassName="wysiwyg-editor"
                                toolbarClassName="wysiwyg-toolbar"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <h3 htmlFor="userAddedToAccount">Welcome a new User to the Account</h3>
                        <div className="wysiwyg-editor-container">
                            <Editor
                                editorState={editorStates.userAddedToAccount}
                                onEditorStateChange={handleEditorStateChange('userAddedToAccount')}
                                wrapperClassName="wysiwyg-wrapper"
                                editorClassName="wysiwyg-editor"
                                toolbarClassName="wysiwyg-toolbar"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <h3 htmlFor="userRemovedFromAccount">Notify a User their account was deleted from the Account</h3>
                        <div className="wysiwyg-editor-container">
                            <Editor
                                editorState={editorStates.userRemovedFromAccount}
                                onEditorStateChange={handleEditorStateChange('userRemovedFromAccount')}
                                wrapperClassName="wysiwyg-wrapper"
                                editorClassName="wysiwyg-editor"
                                toolbarClassName="wysiwyg-toolbar"
                            />
                        </div>
                    </div>
                
                <button type="submit" className="submit-btn">Save Email Settings</button>
            </form>
        </div>
    );
};

export default AdminEmailSettings;