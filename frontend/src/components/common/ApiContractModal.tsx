import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileCode, 
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Modal } from './Modal';
import { useApiConfig } from '../../context/ApiConfigContext';
import { useNotification } from '../../context/NotificationContext';

export const ApiContractModal: React.FC = () => {
  const { 
    isApiGuideOpen, 
    closeApiGuide, 
    isMockMode, 
    setMockMode, 
    apiBaseUrl, 
    setApiBaseUrl, 
    testBackendConnection,
    resetMockData
  } = useApiConfig();

  const { showSuccess, showError, showInfo } = useNotification();
  const [activeTab, setActiveTab] = useState<'endpoints' | 'spring' | 'mysql' | 'connection'>('endpoints');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; result?: { ok: boolean; message: string } }>({
    loading: false,
  });
  const [inputUrl, setInputUrl] = useState(apiBaseUrl);

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    const res = await testBackendConnection();
    setTestStatus({ loading: false, result: res });
    if (res.ok) {
      showSuccess('Backend Connected', res.message);
    } else {
      showError('Connection Failed', res.message);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showInfo('Copied to Clipboard', label);
  };

  const ENDPOINTS = [
    { method: 'POST', path: '/api/auth/login', desc: 'Authenticates staff & returns JWT token with User payload', auth: 'Public' },
    { method: 'GET', path: '/api/dashboard/summary', desc: 'Aggregated client counts, active memberships, expiry flags & follow-up queues', auth: 'User' },
    { method: 'GET', path: '/api/clients', desc: 'Retrieve full or filtered list of gym clients', auth: 'User' },
    { method: 'POST', path: '/api/clients', desc: 'Register a new client record with assigned membership plan', auth: 'User' },
    { method: 'GET', path: '/api/clients/{id}', desc: 'Fetch single client details with membership & activity logs', auth: 'User' },
    { method: 'PUT', path: '/api/clients/{id}', desc: 'Update client personal and membership details', auth: 'User' },
    { method: 'PATCH', path: '/api/clients/{id}/status', desc: 'Deactivate, activate, or update client status', auth: 'User' },
    { method: 'GET', path: '/api/memberships', desc: 'List active and available membership plan packages', auth: 'User' },
    { method: 'POST', path: '/api/memberships', desc: 'Create new membership plan (Admin only)', auth: 'ADMIN' },
    { method: 'GET', path: '/api/communications', desc: 'List logged communications (WhatsApp, calls, notes, email)', auth: 'User' },
    { method: 'POST', path: '/api/communications', desc: 'Log communication event or trigger WhatsApp Cloud API outbound', auth: 'User' },
    { method: 'GET', path: '/api/follow-ups', desc: 'Retrieve pending, today, overdue and completed follow-up tasks', auth: 'User' },
    { method: 'POST', path: '/api/follow-ups', desc: 'Schedule a follow-up action for a specific client', auth: 'User' },
    { method: 'PATCH', path: '/api/follow-ups/{id}', desc: 'Mark follow-up completed or update priority/notes', auth: 'User' },
  ];

  const SPRING_SAMPLE = `// Example Spring Boot Controller for Fit Connect
package com.fitconnect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fitconnect.dto.ClientDTO;
import com.fitconnect.service.ClientService;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/clients")
@CrossOrigin(origins = "*") // Match your frontend origin
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public ResponseEntity<List<ClientDTO>> getAllClients() {
        return ResponseEntity.ok(clientService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientDTO> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ClientDTO> createClient(@Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.ok(clientService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientDTO> updateClient(
            @PathVariable Long id, 
            @Valid @RequestBody ClientDTO dto) {
        return ResponseEntity.ok(clientService.update(id, dto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ClientDTO> updateStatus(
            @PathVariable Long id, 
            @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(clientService.updateStatus(id, request.getStatus()));
    }
}`;

  const MYSQL_SCHEMA = `-- Fit Connect MySQL Database Schema
CREATE DATABASE IF NOT EXISTS fitconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitconnect_db;

-- 1. Users & Staff
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
    phone VARCHAR(30),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Membership Plans
CREATE TABLE membership_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clients
CREATE TABLE clients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    membership_plan_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRING_SOON', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    assigned_staff_id BIGINT,
    emergency_contact VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id),
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
);

-- 4. Communications Log
CREATE TABLE communications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    channel ENUM('WHATSAPP', 'CALL', 'EMAIL', 'IN_PERSON', 'INTERNAL_NOTE') NOT NULL,
    category ENUM('INQUIRY', 'MEMBERSHIP_RENEWAL', 'ATTENDANCE_FOLLOWUP', 'PAYMENT_BILLING', 'GENERAL_SUPPORT') NOT NULL,
    direction ENUM('INCOMING', 'OUTGOING', 'INTERNAL') NOT NULL,
    message_text TEXT NOT NULL,
    delivery_status ENUM('DELIVERED', 'READ', 'PENDING', 'FAILED', 'RECEIVED', 'LOGGED_ONLY') DEFAULT 'LOGGED_ONLY',
    logged_by_staff_id BIGINT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_due_date DATE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (logged_by_staff_id) REFERENCES users(id)
);

-- 5. Follow-Up Tasks
CREATE TABLE follow_ups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    client_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    assigned_staff_id BIGINT NOT NULL,
    priority ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE') DEFAULT 'PENDING',
    notes TEXT,
    category VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
);`;

  return (
    <Modal
      isOpen={isApiGuideOpen}
      onClose={closeApiGuide}
      title="Spring Boot & MySQL Integration Contract"
      description="Technical reference guide for connecting this frontend to your Java Spring Boot REST backend"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'endpoints'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            REST Endpoints (14)
          </button>
          <button
            onClick={() => setActiveTab('spring')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'spring'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Spring Boot Controller
          </button>
          <button
            onClick={() => setActiveTab('mysql')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'mysql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            MySQL Schema DDL
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'connection'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection & Switcher
          </button>
        </div>

        {/* Tab 1: Endpoints */}
        {activeTab === 'endpoints' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              The frontend is structured with an abstracted API client (<code>apiClient.ts</code>) strictly calling these endpoints. 
              All requests send <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">Authorization: Bearer &lt;JWT&gt;</code> header when logged in.
            </p>
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Path</th>
                    <th className="py-2 px-3">Role</th>
                    <th className="py-2 px-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ENDPOINTS.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-[11px]">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            ep.method === 'GET'
                              ? 'bg-blue-50 text-blue-700'
                              : ep.method === 'POST'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ep.method === 'PUT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-900 font-semibold">
                        {ep.path}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{ep.auth}</td>
                      <td className="py-2 px-3 text-slate-600">{ep.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Spring Boot Controller */}
        {activeTab === 'spring' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Standard Spring Boot REST pattern matching frontend DTOs
              </span>
              <button
                onClick={() => copyToClipboard(SPRING_SAMPLE, 'Spring Boot snippet')}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto max-h-96 leading-relaxed">
              {SPRING_SAMPLE}
            </pre>
          </div>
        )}

        {/* Tab 3: MySQL Schema */}
        {activeTab === 'mysql' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                Relational MySQL Schema matching Spring Data JPA Entities
              </span>
              <button
                onClick={() => copyToClipboard(MYSQL_SCHEMA, 'MySQL Schema DDL')}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy DDL
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto max-h-96 leading-relaxed">
              {MYSQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* Tab 4: Connection & Switcher */}
        {activeTab === 'connection' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Current Mode Configuration</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {isMockMode ? 'Interactive Mock Mode (Active)' : 'Live Spring Boot Mode (Active)'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isMockMode
                      ? 'Demonstrating UI with responsive simulated latency and localStorage persistence.'
                      : `Sending real HTTP requests to ${apiBaseUrl}`}
                  </p>
                </div>
                <button
                  onClick={() => setMockMode(!isMockMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isMockMode
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Switch to {isMockMode ? 'Live Spring Boot' : 'Mock Mode'}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Spring Boot Server URL</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => {
                    setApiBaseUrl(inputUrl);
                    showSuccess('Base URL Updated', `Set to ${inputUrl}`);
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Save URL
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus.loading}
                  className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`} />
                  Test Ping
                </button>
              </div>

              {testStatus.result && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    testStatus.result.ok
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  {testStatus.result.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testStatus.result.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  resetMockData();
                  showSuccess('Mock Data Reset', 'Initial sample clients, plans and communications restored.');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
              >
                Reset Demo Mock Data to Initial State
              </button>
              <button
                onClick={closeApiGuide}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
