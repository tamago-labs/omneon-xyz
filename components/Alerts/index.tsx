"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Bell, Settings, AlertTriangle, TrendingUp, TrendingDown, ArrowRight,
    Mail, CheckCircle, Calendar, Shield, Clock, ToggleLeft, X, Edit, RefreshCw
} from 'lucide-react';

const AlertsContainer = () => {


    // Mock data for demonstration
    const initialAlerts = [
        {
            id: 'health-factor',
            category: 'position',
            title: 'Health Factor Alert',
            description: 'Get notified when your health factor drops below a specified threshold',
            enabled: true,
            priority: 'critical',
            settings: {
                threshold: 1.5,
                checkFrequency: 'hourly'
            }
        },
        {
            id: 'liquidation-risk',
            category: 'position',
            title: 'Liquidation Risk',
            description: 'Receive warnings when your position is at risk of liquidation',
            enabled: true,
            priority: 'critical',
            settings: {
                warningThreshold: 1.2,
                checkFrequency: 'hourly'
            }
        },
        {
            id: 'interest-rate-change',
            category: 'market',
            title: 'Interest Rate Changes',
            description: 'Be informed when interest rates change significantly',
            enabled: false,
            priority: 'important',
            settings: {
                changeThreshold: 5,
                assets: ['all']
            }
        },
        {
            id: 'market-volatility',
            category: 'market',
            title: 'Market Volatility Alert',
            description: 'Get notified during periods of high market volatility',
            enabled: false,
            priority: 'important',
            settings: {
                volatilityThreshold: 'high',
                assets: ['IOTA', 'ETH']
            }
        },
        {
            id: 'rewards-earned',
            category: 'rewards',
            title: 'Rewards Summary',
            description: 'Regular updates on rewards earned from staking',
            enabled: true,
            priority: 'informational',
            settings: {
                frequency: 'weekly'
            }
        },
        {
            id: 'protocol-updates',
            category: 'system',
            title: 'Protocol Updates',
            description: 'Stay informed about new features and protocol changes',
            enabled: true,
            priority: 'informational',
            settings: {
                includeMinorUpdates: false
            }
        },
        {
            id: 'security-events',
            category: 'system',
            title: 'Security Notifications',
            description: 'Critical security alerts related to your account',
            enabled: true,
            priority: 'critical',
            settings: {
                includeLoginAttempts: true
            }
        },
        {
            id: 'position-summary',
            category: 'position',
            title: 'Position Summary',
            description: 'Regular summary of your lending and borrowing positions',
            enabled: true,
            priority: 'informational',
            settings: {
                frequency: 'weekly'
            }
        }
    ];

    const [email, setEmail] = useState('user@example.com');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('user@example.com');
    const [alerts, setAlerts] = useState<any>(initialAlerts);
    const [editingAlert, setEditingAlert] = useState<any>(null);
    const [emailVerified, setEmailVerified] = useState(true);
    const [globalSettings, setGlobalSettings] = useState({
        digestMode: 'individual',
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    });

    const toggleAlertEnabled = (alertId: any) => {
        setAlerts(alerts.map((alert: any) =>
            alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
        ));
    };

    const saveEmailEdit = () => {
        setEmail(newEmail);
        setIsEditingEmail(false);
        // In a real implementation, here you would trigger email verification if the email changed
        setEmailVerified(false);
    };

    const cancelEmailEdit = () => {
        setNewEmail(email);
        setIsEditingEmail(false);
    };

    const updateAlertSettings = (updatedSettings: any) => {
        if (editingAlert) {
            setAlerts(alerts.map((alert: any) =>
                alert.id === editingAlert.id
                    ? { ...alert, settings: { ...alert.settings, ...updatedSettings } }
                    : alert
            ));
        }
    };

    const getCategoryIcon = (category: any) => {
        switch (category) {
            case 'position': return <TrendingUp size={18} />;
            case 'market': return <RefreshCw size={18} />;
            case 'rewards': return <CheckCircle size={18} />;
            case 'system': return <Shield size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const getPriorityColor = (priority: any) => {
        switch (priority) {
            case 'critical': return 'text-red-400';
            case 'important': return 'text-yellow-400';
            case 'informational': return 'text-blue-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen  text-white">
            <div className="container mx-auto ">
                <h1 className="text-3xl font-bold mb-2">Alerts</h1>
                <p className="text-gray-300 mb-8">Configure personalized notifications for your account</p>

                {/* Email Configuration Panel */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-xl font-bold mb-1 flex items-center">
                                <Mail size={20} className="mr-2" />
                                Notification Delivery
                            </h2>
                            {!isEditingEmail ? (
                                <div className="flex items-center">
                                    <p className="text-gray-300">{email}</p>
                                    {emailVerified && (
                                        <span className="ml-2 text-green-400 flex items-center text-sm">
                                            <CheckCircle size={14} className="mr-1" /> Verified
                                        </span>
                                    )}
                                    <button
                                        className="ml-3 text-blue-400 hover:text-blue-300 text-sm"
                                        onClick={() => setIsEditingEmail(true)}
                                    >
                                        <Edit size={14} className="inline mr-1" /> Edit
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <input
                                        type="email"
                                        className="bg-gray-700 border border-gray-600 rounded px-3 py-1 mr-2 text-white"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                    <button
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors mr-2"
                                        onClick={saveEmailEdit}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                                        onClick={cancelEmailEdit}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {!emailVerified && (
                                <div className="mt-2 text-yellow-400 text-sm flex items-center">
                                    <AlertTriangle size={14} className="mr-1" />
                                    Please verify your email address to receive notifications
                                    <button className="ml-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-md text-xs text-white transition-colors">
                                        Resend Verification
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center transition-colors"
                                onClick={() => {/* Open delivery settings modal */ }}
                            >
                                <Settings size={16} className="mr-2" />
                                Delivery Settings
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium mb-3">Notification Mode</h3>
                            <div className="flex bg-gray-700/50 rounded-lg p-1">
                                <button
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${globalSettings.digestMode === 'individual' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                                        }`}
                                    onClick={() => setGlobalSettings({ ...globalSettings, digestMode: 'individual' })}
                                >
                                    Individual Alerts
                                </button>
                                <button
                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors ${globalSettings.digestMode === 'digest' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                                        }`}
                                    onClick={() => setGlobalSettings({ ...globalSettings, digestMode: 'digest' })}
                                >
                                    Daily Digest
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {globalSettings.digestMode === 'individual'
                                    ? 'Receive separate email for each alert as it occurs'
                                    : 'Receive a single daily email summarizing all notifications'}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-3 flex items-center">
                                <Clock size={14} className="mr-2" />
                                Quiet Hours
                                <div className="ml-auto">
                                    <button
                                        className={`relative w-10 h-5 transition-colors rounded-full ${globalSettings.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-600'
                                            }`}
                                        onClick={() => setGlobalSettings({
                                            ...globalSettings,
                                            quietHours: {
                                                ...globalSettings.quietHours,
                                                enabled: !globalSettings.quietHours.enabled
                                            }
                                        })}
                                    >
                                        <div className={`absolute w-4 h-4 rounded-full bg-white transition-all transform ${globalSettings.quietHours.enabled ? 'right-0.5' : 'left-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </h3>
                            <div className={`flex space-x-4 ${!globalSettings.quietHours.enabled && 'opacity-50'}`}>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Start</label>
                                    <input
                                        type="time"
                                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                        value={globalSettings.quietHours.start}
                                        onChange={(e) => setGlobalSettings({
                                            ...globalSettings,
                                            quietHours: {
                                                ...globalSettings.quietHours,
                                                start: e.target.value
                                            }
                                        })}
                                        disabled={!globalSettings.quietHours.enabled}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">End</label>
                                    <input
                                        type="time"
                                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                        value={globalSettings.quietHours.end}
                                        onChange={(e) => setGlobalSettings({
                                            ...globalSettings,
                                            quietHours: {
                                                ...globalSettings.quietHours,
                                                end: e.target.value
                                            }
                                        })}
                                        disabled={!globalSettings.quietHours.enabled}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Only critical alerts will be sent during quiet hours
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alert Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {['position', 'market', 'rewards', 'system'].map((category) => (
                        <button
                            key={category}
                            className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-4 hover:bg-gray-700/30 transition-colors text-left"
                        >
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                                    {getCategoryIcon(category)}
                                </div>
                                <div>
                                    <h3 className="font-medium capitalize">{category} Alerts</h3>
                                    <p className="text-xs text-gray-400">
                                        {alerts.filter((a:any) => a.category === category).length} available
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Alerts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {alerts.map((alert: any) => (
                        <div
                            key={alert.id}
                            className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 ${getPriorityColor(alert.priority)}`}>
                                            {getCategoryIcon(alert.category)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{alert.title}</h3>
                                            <p className="text-xs text-gray-400 capitalize">{alert.category}</p>
                                        </div>
                                    </div>

                                    <button
                                        className={`relative w-10 h-5 transition-colors rounded-full ${alert.enabled ? 'bg-blue-600' : 'bg-gray-600'
                                            }`}
                                        onClick={() => toggleAlertEnabled(alert.id)}
                                    >
                                        <div className={`absolute w-4 h-4 rounded-full bg-white transition-all transform ${alert.enabled ? 'right-0.5' : 'left-0.5'
                                            }`} />
                                    </button>
                                </div>

                                <p className="text-sm text-gray-300 mb-4">{alert.description}</p>

                                <div className="flex items-center justify-between">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)} bg-opacity-20 capitalize`}>
                                        {alert.priority}
                                    </span>

                                    <button
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                                        onClick={() => setEditingAlert(alert)}
                                    >
                                        Configure <ArrowRight size={14} className="ml-1" />
                                    </button>
                                </div>
                            </div>

                            {alert.enabled && (
                                <div className="bg-gray-700/30 px-5 py-3 text-xs">
                                    {alert.id === 'health-factor' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Alert threshold:</span>
                                            <span>Below {alert.settings.threshold.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {alert.id === 'liquidation-risk' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Warning at:</span>
                                            <span>Below {alert.settings.warningThreshold.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {alert.id === 'interest-rate-change' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Change threshold:</span>
                                            <span>±{alert.settings.changeThreshold}%</span>
                                        </div>
                                    )}

                                    {alert.id === 'market-volatility' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Assets monitored:</span>
                                            <span>{alert.settings.assets.join(', ')}</span>
                                        </div>
                                    )}

                                    {(alert.id === 'rewards-earned' || alert.id === 'position-summary') && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Frequency:</span>
                                            <span className="capitalize">{alert.settings.frequency}</span>
                                        </div>
                                    )}

                                    {alert.id === 'protocol-updates' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Include minor updates:</span>
                                            <span>{alert.settings.includeMinorUpdates ? 'Yes' : 'No'}</span>
                                        </div>
                                    )}

                                    {alert.id === 'security-events' && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Login notifications:</span>
                                            <span>{alert.settings.includeLoginAttempts ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Alert Settings Modal */}
                {editingAlert && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{editingAlert.title} Settings</h3>
                                <button
                                    className="text-gray-400 hover:text-white"
                                    onClick={() => setEditingAlert(null)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {editingAlert.id === 'health-factor' && (
                                    <div>
                                        <label className="block text-gray-300 mb-2">Health Factor Threshold</label>
                                        <input
                                            type="range"
                                            min="1.1"
                                            max="2"
                                            step="0.1"
                                            value={editingAlert.settings.threshold}
                                            onChange={(e) => updateAlertSettings({ threshold: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm mt-1">
                                            <span>1.1</span>
                                            <span>{editingAlert.settings.threshold.toFixed(1)}</span>
                                            <span>2.0</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            You'll be notified when your health factor falls below this threshold
                                        </p>
                                    </div>
                                )}

                                {editingAlert.id === 'position-summary' && (
                                    <div>
                                        <label className="block text-gray-300 mb-2">Report Frequency</label>
                                        <div className="flex bg-gray-700/50 rounded-lg p-1">
                                            {['daily', 'weekly', 'monthly'].map((freq) => (
                                                <button
                                                    key={freq}
                                                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors capitalize ${editingAlert.settings.frequency === freq ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                                                        }`}
                                                    onClick={() => updateAlertSettings({ frequency: freq })}
                                                >
                                                    {freq}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add more specific settings for other alert types */}

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                        onClick={() => setEditingAlert(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        onClick={() => setEditingAlert(null)}
                                    >
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Alert Test Section */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-4">Test Your Alerts</h2>
                    <p className="text-gray-300 mb-4">
                        Send a test notification to verify your email is properly configured
                    </p>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-full md:w-auto">
                            <select className="w-full md:w-64 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white">
                                <option value="">Select alert type...</option>
                                {alerts.map((alert: any) => (
                                    <option key={alert.id} value={alert.id}>{alert.title}</option>
                                ))}
                            </select>
                        </div>

                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Send Test Notification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AlertsContainer