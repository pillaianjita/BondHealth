// HospitalRegistration.js - Hospital Registration Portal (Single File)
const { query, getClient } = require('./db/config');
const bcrypt = require('bcryptjs');

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BondHealth - Hospital Registration</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #06b6d4;
            --light-blue: #ecfeff;
            --medium-blue: #90caf9;
            --dark-blue: #0891b2;
            --white: #ffffff;
            --light-gray: #f8f9fa;
            --text-dark: #2c3e50;
            --success-green: #4caf50;
            --error-red: #f44336;
            --purple: #7e57c2;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
            min-height: 100vh;
            color: var(--text-dark);
            padding: 20px;
            position: relative;
        }

        .hospital-container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 0 15px;
            position: relative;
            z-index: 10;
        }

        .registration-card {
            background: var(--white);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(30, 136, 229, 0.15);
            border: 2px solid var(--light-blue);
            overflow: hidden;
            margin-bottom: 30px;
            animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .header-section {
            background: linear-gradient(135deg, var(--primary-blue), var(--dark-blue));
            color: white;
            padding: 30px;
            text-align: center;
            border-bottom: 5px solid var(--medium-blue);
        }

        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
            animation: slideInDown 0.8s ease-out 0.2s both;
        }

        @keyframes slideInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .logo-icon {
            font-size: 2.5rem;
        }

        .logo-text {
            font-size: 2.2rem;
            font-weight: 700;
            letter-spacing: 1px;
        }

        .page-title {
            font-size: 2.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            animation: fadeIn 0.8s ease-out 0.3s both;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .page-subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.6;
            animation: fadeIn 0.8s ease-out 0.4s both;
        }

        .form-section {
            padding: 30px;
            border-bottom: 1px solid #e9ecef;
            animation: fadeIn 0.5s ease-out;
        }

        .form-section:last-of-type {
            border-bottom: none;
        }

        .section-title {
            color: var(--dark-blue);
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 3px solid var(--medium-blue);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title i {
            font-size: 1.6rem;
            transition: transform 0.3s ease;
        }

        .section-title:hover i {
            transform: scale(1.1);
        }

        .form-label {
            font-weight: 600;
            color: var(--text-dark);
            margin-bottom: 8px;
        }

        .required::after {
            content: " *";
            color: var(--error-red);
        }

        .form-control, .form-select {
            padding: 12px 15px;
            border: 2px solid #d1e9ff;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            width: 100%;
        }

        .form-control:focus, .form-select:focus {
            border-color: var(--primary-blue);
            box-shadow: 0 0 0 0.25rem rgba(6, 182, 212, 0.25);
            background-color: var(--light-blue);
            outline: none;
            transform: scale(1.01);
        }

        .form-control.is-invalid {
            border-color: var(--error-red);
            background-color: #fff5f5;
        }

        .invalid-feedback {
            color: var(--error-red);
            font-size: 0.875rem;
            margin-top: 5px;
            display: none;
        }

        .invalid-feedback.show {
            display: block;
            animation: shake 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        /* Hospital Logo/Photo Upload Styles */
        .logo-upload-section {
            margin-bottom: 30px;
        }

        .logo-preview-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .logo-preview {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 3px solid var(--light-blue);
            object-fit: cover;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            overflow: hidden;
            position: relative;
            transition: all 0.3s ease;
        }

        .logo-preview:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.2);
        }

        .logo-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
        }

        .logo-preview-placeholder {
            color: #999;
            font-size: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .logo-upload-area {
            border: 2px dashed #b3d9ff;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            background: #f8fdff;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 10px;
        }

        .logo-upload-area:hover {
            border-color: var(--primary-blue);
            background: #e6f7ff;
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(6, 182, 212, 0.2);
        }

        .logo-upload-area.dragover {
            border-color: var(--success-green);
            background: #e8f5e9;
            transform: scale(1.02);
        }

        .logo-input {
            display: none;
        }

        .logo-label {
            display: block;
            cursor: pointer;
            color: var(--primary-blue);
            font-weight: 500;
        }

        .logo-label i {
            font-size: 2.5rem;
            margin-bottom: 15px;
            color: var(--primary-blue);
            display: block;
            transition: transform 0.3s ease;
        }

        .logo-label:hover i {
            transform: scale(1.1);
        }

        .logo-file-name {
            display: block;
            margin-top: 15px;
            color: var(--text-dark);
            font-size: 0.95rem;
            font-weight: 500;
            background: #e3f2fd;
            padding: 8px 15px;
            border-radius: 20px;
            display: inline-block;
        }

        .logo-note {
            color: #666;
            font-size: 0.85rem;
            font-style: italic;
            margin-top: 10px;
            line-height: 1.4;
        }

        .logo-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 15px;
        }

        .logo-action-btn {
            padding: 8px 20px;
            border: none;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .btn-change-logo {
            background: var(--primary-blue);
            color: white;
        }

        .btn-change-logo:hover {
            background: var(--dark-blue);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }

        .btn-remove-logo {
            background: #ffebee;
            color: var(--error-red);
            border: 1px solid #ffcdd2;
        }

        .btn-remove-logo:hover {
            background: #ffcdd2;
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(244, 67, 54, 0.2);
        }

        .logo-specs {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
            border: 1px solid #e9ecef;
            font-size: 0.85rem;
        }

        .logo-specs h6 {
            color: var(--dark-blue);
            margin-bottom: 8px;
            font-weight: 600;
        }

        .logo-specs ul {
            margin: 0;
            padding-left: 20px;
            color: #666;
        }

        .logo-specs li {
            margin-bottom: 5px;
        }

        .radio-group {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            padding: 10px 0;
        }

        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: var(--light-blue);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .radio-option:hover {
            background: #c5e1ff;
            transform: translateY(-4px);
            box-shadow: 0 6px 12px rgba(6, 182, 212, 0.2);
        }

        .radio-option input[type="radio"] {
            accent-color: var(--primary-blue);
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .radio-label {
            font-weight: 500;
            color: var(--text-dark);
            cursor: pointer;
        }

        .departments-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
            margin-bottom: 20px;
        }

        .department-chip {
            padding: 12px 18px;
            background: white;
            border: 2px solid #d1e9ff;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-size: 0.95rem;
            font-weight: 500;
            text-align: center;
            color: var(--text-dark);
        }

        .department-chip:hover {
            background: var(--light-blue);
            border-color: var(--primary-blue);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.2);
        }

        .department-chip.selected {
            background: linear-gradient(135deg, var(--primary-blue), var(--dark-blue));
            color: white;
            border-color: var(--primary-blue);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
            transform: scale(1.02);
        }

        .selected-departments {
            background: var(--light-blue);
            padding: 15px;
            border-radius: 10px;
            border: 2px dashed var(--medium-blue);
            margin-top: 15px;
            font-size: 1rem;
        }

        .selected-departments strong {
            color: var(--dark-blue);
        }

        .file-upload-area {
            border: 2px dashed #b3d9ff;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            background: #f8fdff;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            margin-top: 10px;
        }

        .file-upload-area:hover {
            border-color: var(--primary-blue);
            background: #e6f7ff;
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(6, 182, 212, 0.2);
        }

        .file-input {
            display: none;
        }

        .file-label {
            display: block;
            cursor: pointer;
            color: var(--primary-blue);
            font-weight: 500;
        }

        .file-label i {
            font-size: 1.5rem;
            margin-bottom: 10px;
            transition: transform 0.3s ease;
        }

        .file-label:hover i {
            transform: scale(1.1);
        }

        .file-name {
            display: block;
            margin-top: 10px;
            color: var(--text-dark);
            font-size: 0.95rem;
        }

        .file-note {
            color: #666;
            font-size: 0.9rem;
            font-style: italic;
            margin-top: 5px;
        }

        .submit-section {
            text-align: center;
            background: var(--light-blue);
            padding: 40px 30px !important;
        }

        .submit-btn {
            background: linear-gradient(135deg, var(--primary-blue), var(--dark-blue));
            color: white;
            border: none;
            padding: 16px 40px;
            font-size: 1.2rem;
            font-weight: 600;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: inline-flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.25);
        }

        .submit-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 28px rgba(6, 182, 212, 0.35);
            background: linear-gradient(135deg, #0891b2, #06b6d4);
        }

        .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .submit-btn i {
            font-size: 1.4rem;
        }

        .terms-note {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 0.95rem;
        }

        .terms-note a {
            color: var(--primary-blue);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
        }

        .terms-note a:hover {
            color: var(--dark-blue);
            text-decoration: underline;
        }

        /* Password strength indicator */
        .password-strength {
            margin-top: 8px;
            font-size: 0.85rem;
        }

        .strength-bar {
            height: 4px;
            border-radius: 2px;
            margin-top: 5px;
            transition: all 0.3s ease;
            background: #e0e0e0;
        }

        .strength-bar.weak   { background: var(--error-red); width: 33%; }
        .strength-bar.medium { background: #ff9800; width: 66%; }
        .strength-bar.strong { background: var(--success-green); width: 100%; }

        /* Success Message */
        .success-message {
            text-align: center;
            padding: 60px 30px;
            display: none;
        }

        .success-message.show {
            display: block;
            animation: slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .success-icon {
            font-size: 4rem;
            color: var(--success-green);
            margin-bottom: 20px;
            animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .success-title {
            color: var(--success-green);
            font-size: 2.2rem;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .success-text {
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto 30px;
        }

        .back-btn {
            background: var(--primary-blue);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-size: 1rem;
        }

        .back-btn:hover {
            background: var(--dark-blue);
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(6, 182, 212, 0.3);
        }

        .btn-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        /* Footer */
        .footer {
            text-align: center;
            color: #666;
            font-size: 0.9rem;
            padding: 20px;
            margin-top: 20px;
        }

        .footer a {
            color: var(--primary-blue);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer a:hover {
            color: var(--dark-blue);
            text-decoration: underline;
        }

        /* Hospital Photos Preview */
        .photos-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            justify-content: center;
        }

        .photo-thumb {
            position: relative;
            display: inline-block;
            animation: scaleIn 0.4s ease-out;
        }

        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }

        .photo-thumb img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            transition: all 0.3s ease;
        }

        .photo-thumb img:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .remove-photo {
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--error-red);
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .remove-photo:hover {
            transform: scale(1.1);
            background: #d32f2f;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-section { padding: 20px; }
            .logo-text { font-size: 1.8rem; }
            .page-title { font-size: 1.8rem; }
            .form-section { padding: 20px; }
            .departments-container { grid-template-columns: repeat(2, 1fr); }
            .radio-group { flex-direction: column; gap: 10px; }
            .logo-upload-area { padding: 20px; }
            .logo-preview { width: 120px; height: 120px; }
            .btn-group { flex-direction: column; align-items: center; }
        }

        @media (max-width: 480px) {
            .departments-container { grid-template-columns: 1fr; }
            .logo { flex-direction: column; gap: 5px; }
            .logo-actions { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="hospital-container">
        <!-- Registration Form Card -->
        <div class="registration-card">

            <!-- Header Section -->
            <div class="header-section">
                <div class="logo">
                    <div class="logo-icon">🏥</div>
                    <div class="logo-text">BondHealth</div>
                </div>
                <h1 class="page-title">Hospital Registration</h1>
                <p class="page-subtitle">Join our healthcare network to provide better services to patients. Fill out the form below to register your hospital.</p>
            </div>

            <!-- ✅ FIX #2: Success Message (hidden by default) -->
            <div id="successMessage" class="success-message" style="display: none;">
                <div class="success-icon">✅</div>
                <h2 class="success-title">Registration Successful!</h2>
                <p class="success-text">Your hospital has been successfully registered with BondHealth. A temporary password has been sent to your admin email.</p>
                <div class="btn-group">
                    <button onclick="goToDashboard()" class="back-btn" style="background: var(--primary-blue);">
                        <i class="fas fa-tachometer-alt"></i> Go to Dashboard
                    </button>
                    <button onclick="resetForm()" class="back-btn" style="background: var(--success-green);">
                        <i class="fas fa-redo"></i> Register Another
                    </button>
                </div>
            </div>

            <!-- Registration Form -->
            <form id="hospitalRegistrationForm" class="registration-form">

                <!-- Hospital Logo & Photos Section -->
                <div class="form-section logo-upload-section">
                    <h3 class="section-title"><i class="fas fa-camera"></i> Hospital Logo & Photos</h3>

                    <div class="logo-preview-container">
                        <div class="logo-preview" id="logoPreview">
                            <div class="logo-preview-placeholder">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <img id="logoPreviewImage" alt="Hospital Logo Preview">
                        </div>
                    </div>

                    <div class="logo-upload-area" id="logoUploadArea">
                        <input type="file" class="logo-input" id="hospitalLogo" accept=".jpg,.jpeg,.png,.gif,.svg">
                        <label for="hospitalLogo" class="logo-label">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Click to upload Hospital Logo</span>
                            <div class="logo-note">Recommended: 500x500px, JPG/PNG format, Max 5MB</div>
                            <span class="logo-file-name" id="logoFileName">No file chosen</span>
                        </label>
                    </div>

                    <div class="logo-actions" id="logoActions" style="display: none;">
                        <button type="button" class="logo-action-btn btn-change-logo" onclick="document.getElementById('hospitalLogo').click()">
                            <i class="fas fa-sync-alt"></i> Change Logo
                        </button>
                        <button type="button" class="logo-action-btn btn-remove-logo" onclick="removeLogo()">
                            <i class="fas fa-trash"></i> Remove Logo
                        </button>
                    </div>

                    <div class="logo-specs">
                        <h6><i class="fas fa-info-circle"></i> Logo Requirements:</h6>
                        <ul>
                            <li>High-resolution logo (minimum 500x500 pixels)</li>
                            <li>Accepted formats: JPG, PNG, GIF, SVG</li>
                            <li>Maximum file size: 5MB</li>
                            <li>Clear and professional design</li>
                            <li>Logo should be visible on both light and dark backgrounds</li>
                        </ul>
                    </div>

                    <div class="mt-4">
                        <label class="form-label required">Primary Hospital Photo</label>
                        <p class="file-note">This photo is used as the hospital profile image in dashboards.</p>
                        <div class="file-upload-area" id="hospitalMainPhotoArea">
                            <input type="file" class="file-input" id="hospitalMainPhoto" accept=".jpg,.jpeg,.png">
                            <label for="hospitalMainPhoto" class="file-label">
                                <i class="fas fa-image"></i><br>
                                Click to upload Primary Hospital Photo
                            </label>
                            <span class="file-name" id="hospitalMainPhotoName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="hospitalMainPhotoError"></div>
                    </div>

                    <div class="mt-4">
                        <label class="form-label">Additional Hospital Photos (Optional)</label>
                        <p class="file-note">Upload photos of hospital building, reception, waiting area, etc.</p>
                        <div class="file-upload-area" id="hospitalPhotosArea">
                            <input type="file" class="file-input" id="hospitalPhotos" accept=".jpg,.jpeg,.png" multiple>
                            <label for="hospitalPhotos" class="file-label">
                                <i class="fas fa-images"></i><br>
                                Click to upload Hospital Photos
                            </label>
                            <span class="file-name" id="hospitalPhotosName">No files chosen</span>
                        </div>
                        <div class="invalid-feedback" id="hospitalPhotosError"></div>
                        <div id="hospitalPhotosPreview" class="photos-preview" style="display: none;"></div>
                    </div>
                </div>

                <!-- Hospital Information Section -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-hospital"></i> Hospital Information</h3>

                    <div class="mb-4">
                        <label for="hospName" class="form-label required">Hospital Name</label>
                        <input type="text" class="form-control" id="hospName" placeholder="Enter hospital name">
                        <div class="invalid-feedback" id="hospNameError">Please enter hospital name.</div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label required">Hospital Type</label>
                        <div class="radio-group">
                            <div class="radio-option">
                                <input type="radio" id="typeGovt" name="hospType" value="GOVT">
                                <label class="radio-label" for="typeGovt">GOVT</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" id="typePrivate" name="hospType" value="Private">
                                <label class="radio-label" for="typePrivate">Private</label>
                            </div>
                            <div class="radio-option">
                                <input type="radio" id="typeClinic" name="hospType" value="Clinic">
                                <label class="radio-label" for="typeClinic">Clinic</label>
                            </div>
                        </div>
                        <div class="invalid-feedback" id="hospTypeError">Please select hospital type.</div>
                    </div>

                    <div class="mb-4">
                        <label for="registrationNumber" class="form-label required">Registration Number</label>
                        <input type="text" class="form-control" id="registrationNumber" placeholder="Issued by health authority">
                        <div class="invalid-feedback" id="registrationNumberError">Please enter registration number.</div>
                    </div>
                </div>

                <!-- ✅ FIX #1: Corrected Location & Contact Section HTML structure -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-map-marker-alt"></i> Location & Contact</h3>

                    <div class="mb-4">
                        <label for="city" class="form-label required">City / Location</label>
                        <input type="text" class="form-control" id="city" placeholder="Enter city">
                        <div class="invalid-feedback" id="cityError">Please enter city/location.</div>
                    </div>

                    <!-- FIX: Wrapped both fields in a proper <div class="row"> -->
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="contactNo" class="form-label required">Contact Number</label>
                            <input type="tel" class="form-control" id="contactNo" placeholder="+91 9876543210"
                                   pattern="[0-9]{10}" maxlength="10"
                                   oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
                            <div class="invalid-feedback" id="contactNoError">Please enter a valid 10-digit contact number.</div>
                            <small class="text-muted">Enter 10-digit mobile number without country code</small>
                        </div>

                        <div class="col-md-6 mb-4">
                            <label for="officialEmail" class="form-label required">Official Email</label>
                            <input type="email" class="form-control" id="officialEmail" placeholder="hospital@example.com" autocomplete="off" inputmode="email" autocapitalize="none" spellcheck="false">
                            <div class="invalid-feedback" id="officialEmailError">Please enter a valid email address.</div>
                        </div>
                    </div>
                </div>

                <!-- Authorized Representative Section -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-user-tie"></i> Authorized Representative Details</h3>

                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="adminName" class="form-label required">Admin Name</label>
                            <input type="text" class="form-control" id="adminName" placeholder="Enter admin name">
                            <div class="invalid-feedback" id="adminNameError">Please enter admin name.</div>
                        </div>

                        <div class="col-md-6 mb-4">
                            <label for="designation" class="form-label required">Designation</label>
                            <input type="text" class="form-control" id="designation" placeholder="Enter designation">
                            <div class="invalid-feedback" id="designationError">Please enter designation.</div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label for="adminEmail" class="form-label required">Admin Email</label>
                        <input type="email" class="form-control" id="adminEmail" placeholder="admin@example.com" autocomplete="off" inputmode="email" autocapitalize="none" spellcheck="false">
                        <div class="invalid-feedback" id="adminEmailError">Please enter a valid email address.</div>
                    </div>

                    <div class="mb-4">
                        <label for="adminPhoto" class="form-label required">Admin Profile Photo</label>
                        <div class="file-upload-area" id="adminPhotoArea">
                            <input type="file" class="file-input" id="adminPhoto" accept=".jpg,.jpeg,.png">
                            <label for="adminPhoto" class="file-label">
                                <i class="fas fa-user-circle"></i><br>
                                Click to upload Admin Photo
                            </label>
                            <span class="file-name" id="adminPhotoName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="adminPhotoError"></div>
                    </div>

                    <!-- ✅ FIX #4: Added Password & Confirm Password fields -->
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <label for="adminPassword" class="form-label required">Password</label>
                            <input type="password" class="form-control" id="adminPassword"
                                   placeholder="Create a password (min 8 characters)"
                                   oninput="checkPasswordStrength(this.value)">
                            <div class="invalid-feedback" id="adminPasswordError">Password must be at least 8 characters.</div>
                            <div class="password-strength">
                                <div class="strength-bar" id="strengthBar"></div>
                                <small id="strengthText" style="color:#888;"></small>
                            </div>
                        </div>

                        <div class="col-md-6 mb-4">
                            <label for="confirmPassword" class="form-label required">Confirm Password</label>
                            <input type="password" class="form-control" id="confirmPassword"
                                   placeholder="Re-enter your password">
                            <div class="invalid-feedback" id="confirmPasswordError">Passwords do not match.</div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label">Faculty Services (Optional)</label>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <input type="text" class="form-control" id="facultyService1" placeholder="Faculty service 1">
                            </div>
                            <div class="col-md-6 mb-3">
                                <input type="text" class="form-control" id="facultyService2" placeholder="Faculty service 2">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Departments Section -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-stethoscope"></i> Departments Available</h3>

                    <div class="mb-4">
                        <label class="form-label required">Select Departments</label>
                        <div class="departments-container" id="departmentsContainer">
                            <!-- Departments rendered by JavaScript -->
                        </div>
                        <div class="invalid-feedback" id="departmentsError">Please select at least one department.</div>
                        <div class="selected-departments">
                            <strong>Selected Departments:</strong> <span id="selectedDeptsText">None selected</span>
                        </div>
                    </div>
                </div>

                <!-- Documents Upload Section -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-file-upload"></i> Upload Documents</h3>

                    <div class="mb-4">
                        <label class="form-label required">Hospital Registration Certificate</label>
                        <p class="file-note">by CEA, State Health Dept</p>
                        <div class="file-upload-area" id="regCertificateArea">
                            <input type="file" class="file-input" id="regCertificate" accept=".pdf,.jpg,.jpeg,.png">
                            <label for="regCertificate" class="file-label">
                                <i class="fas fa-cloud-upload-alt"></i><br>
                                Click to upload Hospital Registration Certificate
                            </label>
                            <span class="file-name" id="regCertificateName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="regCertificateError">Please upload registration certificate.</div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label required">Hospital License</label>
                        <p class="file-note">by CEA, State Health Dept</p>
                        <div class="file-upload-area" id="hospitalLicenseArea">
                            <input type="file" class="file-input" id="hospitalLicense" accept=".pdf,.jpg,.jpeg,.png">
                            <label for="hospitalLicense" class="file-label">
                                <i class="fas fa-cloud-upload-alt"></i><br>
                                Click to upload Hospital License
                            </label>
                            <span class="file-name" id="hospitalLicenseName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="hospitalLicenseError">Please upload hospital license.</div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label required">Trade License / Incorporated</label>
                        <p class="file-note">by Municipality, Registrar</p>
                        <div class="file-upload-area" id="tradeLicenseArea">
                            <input type="file" class="file-input" id="tradeLicense" accept=".pdf,.jpg,.jpeg,.png">
                            <label for="tradeLicense" class="file-label">
                                <i class="fas fa-cloud-upload-alt"></i><br>
                                Click to upload Trade License
                            </label>
                            <span class="file-name" id="tradeLicenseName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="tradeLicenseError">Please upload trade license.</div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label required">PAN Card of Hospital</label>
                        <p class="file-note">Annexed to SRF</p>
                        <div class="file-upload-area" id="panCardArea">
                            <input type="file" class="file-input" id="panCard" accept=".pdf,.jpg,.jpeg,.png">
                            <label for="panCard" class="file-label">
                                <i class="fas fa-cloud-upload-alt"></i><br>
                                Click to upload PAN Card
                            </label>
                            <span class="file-name" id="panCardName">No file chosen</span>
                        </div>
                        <div class="invalid-feedback" id="panCardError">Please upload PAN card.</div>
                    </div>
                </div>

                <!-- Submit Section -->
                <div class="form-section submit-section">
                    <button type="submit" class="submit-btn" id="submitBtn">
                        <i class="fas fa-rocket"></i> Sign Up & Register Hospital
                    </button>
                    <p class="terms-note">
                        By registering, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    </p>
                </div>

            </form>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>© 2024 BondHealth. All rights reserved. | <a href="/signin" style="color: var(--primary-blue); font-weight: 600;">← Back to Sign In</a></p>
        </div>
    </div>

    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>

    <script>
        // ─────────────────────────────────────────
        // GLOBAL STATE
        // ─────────────────────────────────────────
        const departmentOptions = [
            'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
            'Gynecology', 'Dermatology', 'Emergency', 'Radiology',
            'General Surgery', 'Internal Medicine', 'Oncology', 'Psychiatry'
        ];

        let selectedDepartments = [];
        let hospitalLogoData    = null;
        let hospitalPhotosData  = [];

        // ─────────────────────────────────────────
        // INIT
        // ─────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', function () {
            renderDepartments();
            setupFileUploads();
            setupLogoUpload();
            setupFormSubmission();
            setupEmailValidationUX();
        });

        function setupEmailValidationUX() {
            const bindEmailInput = (fieldId, errorId) => {
                const input = document.getElementById(fieldId);
                if (!input) return;
                input.addEventListener('input', () => clearError(errorId));
                input.addEventListener('blur', () => {
                    input.value = sanitizeEmail(input.value);
                    if (input.value && !isValidEmail(input.value)) {
                        showError(errorId, 'Please enter a valid email address.');
                    }
                });
            };
            bindEmailInput('officialEmail', 'officialEmailError');
            bindEmailInput('adminEmail', 'adminEmailError');
        }

        // ─────────────────────────────────────────
        // ✅ FIX #4: Password strength checker
        // ─────────────────────────────────────────
        function checkPasswordStrength(password) {
            const bar  = document.getElementById('strengthBar');
            const text = document.getElementById('strengthText');

            bar.className = 'strength-bar';
            if (!password) { text.textContent = ''; return; }

            if (password.length < 6) {
                bar.classList.add('weak');
                text.textContent = 'Weak';
                text.style.color = '#f44336';
            } else if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
                bar.classList.add('medium');
                text.textContent = 'Medium';
                text.style.color = '#ff9800';
            } else {
                bar.classList.add('strong');
                text.textContent = 'Strong';
                text.style.color = '#4caf50';
            }
        }

        // ─────────────────────────────────────────
        // LOGO UPLOAD
        // ─────────────────────────────────────────
        function setupLogoUpload() {
            const logoInput           = document.getElementById('hospitalLogo');
            const logoPreview         = document.getElementById('logoPreviewImage');
            const logoPlaceholder     = document.querySelector('.logo-preview-placeholder');
            const logoUploadArea      = document.getElementById('logoUploadArea');
            const logoFileName        = document.getElementById('logoFileName');
            const logoActions         = document.getElementById('logoActions');
            const hospitalPhotosInput = document.getElementById('hospitalPhotos');
            const hospitalPhotosPreview = document.getElementById('hospitalPhotosPreview');
            const hospitalPhotosName  = document.getElementById('hospitalPhotosName');
            const hospitalMainPhotoInput = document.getElementById('hospitalMainPhoto');
            const hospitalMainPhotoName = document.getElementById('hospitalMainPhotoName');
            const adminPhotoInput = document.getElementById('adminPhoto');
            const adminPhotoName = document.getElementById('adminPhotoName');

            // --- Logo file change ---
            logoInput.addEventListener('change', function () {
                if (!this.files.length) return;
                const file = this.files[0];

                if (file.size > 5 * 1024 * 1024) {
                    alert('File size exceeds 5MB limit. Please upload a smaller file.');
                    this.value = '';
                    return;
                }

                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
                if (!validTypes.includes(file.type)) {
                    alert('Invalid file type. Please upload JPG, PNG, GIF, or SVG files.');
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    hospitalLogoData = { name: file.name, type: file.type, size: file.size, data: e.target.result };
                    logoPreview.src           = e.target.result;
                    logoPreview.style.display = 'block';
                    logoPlaceholder.style.display = 'none';
                    logoFileName.textContent  = file.name;
                    logoFileName.style.color  = '#1565c0';
                    logoActions.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            });

            // --- Hospital photos ---
            hospitalPhotosInput.addEventListener('change', function () {
                if (!this.files.length) return;
                hospitalPhotosData = [];
                hospitalPhotosPreview.innerHTML = '';

                for (let i = 0; i < Math.min(this.files.length, 5); i++) {
                    const file = this.files[i];

                    if (file.size > 5 * 1024 * 1024) { alert(\`"\${file.name}" exceeds 5MB. Skipping.\`); continue; }

                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                    if (!validTypes.includes(file.type)) { alert(\`Invalid type for "\${file.name}". Skipping.\`); continue; }

                    const reader = new FileReader();
                    reader.onload = (function (f) {
                        return function (e) {
                            hospitalPhotosData.push({ name: f.name, type: f.type, size: f.size, data: e.target.result });

                            const thumb     = document.createElement('div');
                            thumb.className = 'photo-thumb';

                            const img = document.createElement('img');
                            img.src   = e.target.result;
                            img.alt   = f.name;

                            const removeBtn       = document.createElement('button');
                            removeBtn.className   = 'remove-photo';
                            removeBtn.innerHTML   = '×';
                            removeBtn.onclick     = function () {
                                thumb.remove();
                                hospitalPhotosData = hospitalPhotosData.filter(p => p.name !== f.name);
                                updatePhotosFileName();
                                if (!hospitalPhotosData.length) hospitalPhotosPreview.style.display = 'none';
                            };

                            thumb.appendChild(img);
                            thumb.appendChild(removeBtn);
                            hospitalPhotosPreview.appendChild(thumb);
                            updatePhotosFileName();
                            hospitalPhotosPreview.style.display = 'flex';
                        };
                    })(file);
                    reader.readAsDataURL(file);
                }
            });

            hospitalMainPhotoInput.addEventListener('change', function () {
                if (this.files.length > 0) {
                    hospitalMainPhotoName.textContent = this.files[0].name;
                    hospitalMainPhotoName.style.color = '#1565c0';
                    clearError('hospitalMainPhotoError');
                } else {
                    hospitalMainPhotoName.textContent = 'No file chosen';
                    hospitalMainPhotoName.style.color = '';
                }
            });

            adminPhotoInput.addEventListener('change', function () {
                if (this.files.length > 0) {
                    adminPhotoName.textContent = this.files[0].name;
                    adminPhotoName.style.color = '#1565c0';
                    clearError('adminPhotoError');
                } else {
                    adminPhotoName.textContent = 'No file chosen';
                    adminPhotoName.style.color = '';
                }
            });

            function updatePhotosFileName() {
                if (hospitalPhotosData.length > 0) {
                    hospitalPhotosName.textContent = \`\${hospitalPhotosData.length} file(s) selected\`;
                    hospitalPhotosName.style.color = '#1565c0';
                } else {
                    hospitalPhotosName.textContent = 'No files chosen';
                    hospitalPhotosName.style.color = '';
                }
            }

            // --- Drag & drop for logo ---
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
                logoUploadArea.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); }, false)
            );
            ['dragenter', 'dragover'].forEach(evt =>
                logoUploadArea.addEventListener(evt, () => logoUploadArea.classList.add('dragover'), false)
            );
            ['dragleave', 'drop'].forEach(evt =>
                logoUploadArea.addEventListener(evt, () => logoUploadArea.classList.remove('dragover'), false)
            );
            logoUploadArea.addEventListener('drop', function (e) {
                const files = e.dataTransfer.files;
                if (files.length) { logoInput.files = files; logoInput.dispatchEvent(new Event('change')); }
            });

            logoUploadArea.addEventListener('click', function (e) {
                const interactiveTarget = e.target.closest('label, input, button, a');
                if (interactiveTarget) return;
                logoInput.click();
            });
        }

        // ─────────────────────────────────────────
        // REMOVE LOGO
        // ─────────────────────────────────────────
        function removeLogo() {
            hospitalLogoData = null;
            const logoPreview     = document.getElementById('logoPreviewImage');
            const logoPlaceholder = document.querySelector('.logo-preview-placeholder');
            const logoFileName    = document.getElementById('logoFileName');
            const logoActions     = document.getElementById('logoActions');

            logoPreview.style.display     = 'none';
            logoPlaceholder.style.display = 'flex';
            logoFileName.textContent      = 'No file chosen';
            logoFileName.style.color      = '';
            logoActions.style.display     = 'none';
            document.getElementById('hospitalLogo').value = '';
        }

        // ─────────────────────────────────────────
        // DEPARTMENTS
        // ─────────────────────────────────────────
        function renderDepartments() {
            const container = document.getElementById('departmentsContainer');
            container.innerHTML = '';

            departmentOptions.forEach(dept => {
                const chip       = document.createElement('div');
                chip.className   = 'department-chip' + (selectedDepartments.includes(dept) ? ' selected' : '');
                chip.textContent = dept;
                chip.addEventListener('click', () => toggleDepartment(dept));
                container.appendChild(chip);
            });

            updateSelectedDepartmentsText();
        }

        function toggleDepartment(dept) {
            const index = selectedDepartments.indexOf(dept);
            if (index === -1) selectedDepartments.push(dept);
            else selectedDepartments.splice(index, 1);
            renderDepartments();
            clearError('departmentsError');
        }

        function updateSelectedDepartmentsText() {
            document.getElementById('selectedDeptsText').textContent =
                selectedDepartments.length ? selectedDepartments.join(', ') : 'None selected';
        }

        // ─────────────────────────────────────────
        // DOCUMENT FILE UPLOADS
        // ─────────────────────────────────────────
        function setupFileUploads() {
            const fileInputs = [
                { id: 'regCertificate',  nameId: 'regCertificateName',  areaId: 'regCertificateArea'  },
                { id: 'hospitalLicense', nameId: 'hospitalLicenseName', areaId: 'hospitalLicenseArea' },
                { id: 'tradeLicense',    nameId: 'tradeLicenseName',    areaId: 'tradeLicenseArea'    },
                { id: 'panCard',         nameId: 'panCardName',         areaId: 'panCardArea'         }
            ];

            fileInputs.forEach(file => {
                const input       = document.getElementById(file.id);
                const nameElement = document.getElementById(file.nameId);
                const area        = document.getElementById(file.areaId);

                input.addEventListener('change', function () {
                    if (this.files.length > 0) {
                        nameElement.textContent   = this.files[0].name;
                        nameElement.style.color   = '#1565c0';
                        nameElement.style.fontWeight = '600';
                        clearError(file.id + 'Error');
                    } else {
                        nameElement.textContent      = 'No file chosen';
                        nameElement.style.color      = '';
                        nameElement.style.fontWeight = '';
                    }
                });

                area.addEventListener('click', function (e) {
                    const interactiveTarget = e.target.closest('label, input, button, a');
                    if (interactiveTarget) return;
                    input.click();
                });
            });
        }

        // ─────────────────────────────────────────
        // ✅ FIX #5: FORM SUBMISSION — calls backend via fetch
        // ─────────────────────────────────────────
        function setupFormSubmission() {
            const form = document.getElementById('hospitalRegistrationForm');

            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                if (!validateForm()) return;

                const submitBtn  = document.getElementById('submitBtn');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Registering...';
                submitBtn.disabled   = true;

                try {
                    // Build FormData to include files
                    const formDataObj = new FormData();
                    const formData = getFormData();

                    // Add all text fields
                    Object.keys(formData).forEach(key => {
                        const value = formData[key];
                        if (typeof value === 'string') {
                            formDataObj.append(key, value);
                        } else if (Array.isArray(value)) {
                            formDataObj.append(key, JSON.stringify(value));
                        } else if (typeof value === 'object') {
                            formDataObj.append(key, JSON.stringify(value));
                        }
                    });

                    // Add hospital logo file
                    if (hospitalLogoData) {
                        const logoFile = document.getElementById('hospitalLogo').files[0];
                        if (logoFile) {
                            formDataObj.append('hospitalLogo', logoFile);
                        }
                    }

                    // Add hospital photos files
                    const mainPhotoFile = document.getElementById('hospitalMainPhoto').files[0];
                    if (mainPhotoFile) {
                        formDataObj.append('hospitalMainPhoto', mainPhotoFile);
                    }

                    const photosInput = document.getElementById('hospitalPhotos');
                    if (photosInput && photosInput.files.length > 0) {
                        Array.from(photosInput.files).forEach(file => {
                            formDataObj.append('hospitalPhotos', file);
                        });
                    }

                    const adminPhotoFile = document.getElementById('adminPhoto').files[0];
                    if (adminPhotoFile) {
                        formDataObj.append('adminPhoto', adminPhotoFile);
                    }

                    // Add documents
                    const documentsArray = [
                        { id: 'regCertificate',  name: 'regCertificate' },
                        { id: 'hospitalLicense', name: 'hospitalLicense' },
                        { id: 'tradeLicense',    name: 'tradeLicense' },
                        { id: 'panCard',         name: 'panCard' }
                    ];

                    documentsArray.forEach(doc => {
                        const fileInput = document.getElementById(doc.id);
                        if (fileInput && fileInput.files.length > 0) {
                            formDataObj.append(doc.name, fileInput.files[0]);
                        }
                    });

                    const response = await fetch('/api/hospitals/register', {
                        method: 'POST',
                        body: formDataObj  // ✅ Changed: use FormData instead of JSON
                    });
                    const contentType = response.headers.get('content-type') || '';
                    const result = contentType.includes('application/json')
                        ? await response.json()
                        : { success: false, error: (await response.text()).slice(0, 200) || 'Non-JSON server response' };

                    if (!response.ok || !result.success) {
                        throw new Error(result.error || 'Registration failed. Please try again.');
                    }

                    // ✅ FIX #2: Safe sessionStorage usage with try/catch
                    try {
                        sessionStorage.setItem('currentHospital', JSON.stringify({
                            id:        result.hospitalId,
                            name:      formData.hospitalName,
                            email:     formData.officialEmail,
                            adminName: formData.adminName
                        }));
                    } catch (storageErr) {
                        console.warn('sessionStorage unavailable:', storageErr);
                    }

     form.style.display = 'none';
const successMessage = document.getElementById('successMessage');
successMessage.style.display = 'block';

                } catch (error) {
                    console.error('Registration error:', error);
                    const msg = String(error?.message || '').toLowerCase();
                    if (msg.includes('email') && msg.includes('already')) {
                        showError('adminEmailError', 'This email is already registered. Use another email.');
                        const adminEmailField = document.getElementById('adminEmail');
                        adminEmailField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        adminEmailField?.focus();
                    }
                    alert('Registration failed: ' + error.message);
                } finally {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled  = false;
                }
            });
        }

        // ─────────────────────────────────────────
        // ✅ FIX #3 & GLOBAL: goToDashboard / resetForm defined at global scope
        // ─────────────────────────────────────────
        async function goToDashboard() {
         try {
        const adminEmail = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        // Sign in automatically
        const res = await fetch('/api/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: adminEmail,
                password: password,
                role: 'admin'
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            window.location.href = '/hospital-dashboard';
        } else {
            alert('Auto login failed. Please sign in manually.');
            window.location.href = '/signin';
        }
    } catch (err) {
        console.error('Auto login error:', err);
        window.location.href = '/signin';
    }
       }

        function resetForm() {
            document.getElementById('successMessage').style.display        = 'none';
            document.getElementById('hospitalRegistrationForm').style.display = 'block';
            document.getElementById('hospitalRegistrationForm').reset();

            // Reset departments
            selectedDepartments = [];
            renderDepartments();

            // Reset logo
            removeLogo();

            // Reset photos
            hospitalPhotosData = [];
            const photosPreview = document.getElementById('hospitalPhotosPreview');
            photosPreview.innerHTML      = '';
            photosPreview.style.display  = 'none';
            document.getElementById('hospitalPhotosName').textContent = 'No files chosen';

            // Reset document file names
            ['regCertificateName', 'hospitalLicenseName', 'tradeLicenseName', 'panCardName'].forEach(id => {
                document.getElementById(id).textContent = 'No file chosen';
            });

            // Reset password strength UI
            document.getElementById('strengthBar').className  = 'strength-bar';
            document.getElementById('strengthText').textContent = '';

            clearAllErrors();
        }

        // ─────────────────────────────────────────
        // VALIDATION
        // ─────────────────────────────────────────
        function validateForm() {
            let isValid = true;
            clearAllErrors();
            const errorFieldMap = {
                hospTypeError: 'typeGovt',
                departmentsError: 'departmentsContainer',
                hospitalMainPhotoError: 'hospitalMainPhotoArea',
                adminPhotoError: 'adminPhotoArea',
                regCertificateError: 'regCertificateArea',
                hospitalLicenseError: 'hospitalLicenseArea',
                tradeLicenseError: 'tradeLicenseArea',
                panCardError: 'panCardArea'
            };

            const focusFirstError = () => {
                const firstError = document.querySelector('.invalid-feedback.show');
                if (!firstError) return;
                const mappedFieldId = errorFieldMap[firstError.id];
                const target = mappedFieldId
                    ? document.getElementById(mappedFieldId)
                    : document.getElementById(firstError.id.replace('Error', ''));
                if (!target) return;
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof target.focus === 'function') {
                    setTimeout(() => target.focus({ preventScroll: true }), 150);
                }
            };

            // Hospital Name
            if (!document.getElementById('hospName').value.trim()) {
                showError('hospNameError', 'Please enter hospital name.');
                isValid = false;
            }

            // Hospital Type
            if (!document.querySelector('input[name="hospType"]:checked')) {
                showError('hospTypeError', 'Please select hospital type.');
                isValid = false;
            }

            // Registration Number
            if (!document.getElementById('registrationNumber').value.trim()) {
                showError('registrationNumberError', 'Please enter registration number.');
                isValid = false;
            }

            // City
            if (!document.getElementById('city').value.trim()) {
                showError('cityError', 'Please enter city/location.');
                isValid = false;
            }

            // Contact Number
            const contactNo = document.getElementById('contactNo').value.trim();
            if (!contactNo) {
                showError('contactNoError', 'Please enter contact number.');
                isValid = false;
            } else if (!/^[0-9]{10}$/.test(contactNo)) {
                showError('contactNoError', 'Please enter a valid 10-digit number.');
                isValid = false;
            }

            // Official Email
            const officialEmailInput = document.getElementById('officialEmail');
            const officialEmail = sanitizeEmail(officialEmailInput.value);
            officialEmailInput.value = officialEmail;
            if (!officialEmail) {
                showError('officialEmailError', 'Please enter official email.');
                isValid = false;
            } else if (!isValidEmail(officialEmail)) {
                showError('officialEmailError', 'Please enter a valid email address.');
                isValid = false;
            }

            // Admin Name
            if (!document.getElementById('adminName').value.trim()) {
                showError('adminNameError', 'Please enter admin name.');
                isValid = false;
            }

            // Designation
            if (!document.getElementById('designation').value.trim()) {
                showError('designationError', 'Please enter designation.');
                isValid = false;
            }

            // Admin Email
            const adminEmailInput = document.getElementById('adminEmail');
            const adminEmail = sanitizeEmail(adminEmailInput.value);
            adminEmailInput.value = adminEmail;
            if (!adminEmail) {
                showError('adminEmailError', 'Please enter admin email.');
                isValid = false;
            } else if (!isValidEmail(adminEmail)) {
                showError('adminEmailError', 'Please enter a valid email address.');
                isValid = false;
            }

            // ✅ FIX #4: Validate Password fields
            const password        = document.getElementById('adminPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!password) {
                showError('adminPasswordError', 'Please enter a password.');
                isValid = false;
            } else if (password.length < 8) {
                showError('adminPasswordError', 'Password must be at least 8 characters.');
                isValid = false;
            }

            if (!confirmPassword) {
                showError('confirmPasswordError', 'Please confirm your password.');
                isValid = false;
            } else if (password && password !== confirmPassword) {
                showError('confirmPasswordError', 'Passwords do not match.');
                isValid = false;
            }

            // Departments
            if (selectedDepartments.length === 0) {
                showError('departmentsError', 'Please select at least one department.');
                isValid = false;
            }

            if (!document.getElementById('hospitalMainPhoto').files.length) {
                showError('hospitalMainPhotoError', 'Please upload the primary hospital photo.');
                isValid = false;
            }

            if (!document.getElementById('adminPhoto').files.length) {
                showError('adminPhotoError', 'Please upload admin profile photo.');
                isValid = false;
            }

            // Required document uploads
            [
                { id: 'regCertificate',  errorId: 'regCertificateError',  label: 'registration certificate' },
                { id: 'hospitalLicense', errorId: 'hospitalLicenseError', label: 'hospital license'          },
                { id: 'tradeLicense',    errorId: 'tradeLicenseError',    label: 'trade license'             },
                { id: 'panCard',         errorId: 'panCardError',         label: 'PAN card'                  }
            ].forEach(file => {
                if (!document.getElementById(file.id).files.length) {
                    showError(file.errorId, \`Please upload the \${file.label}.\`);
                    isValid = false;
                }
            });

            if (!isValid) {
                focusFirstError();
            }
            return isValid;
        }

        // ─────────────────────────────────────────
        // GET FORM DATA
        // ─────────────────────────────────────────
        function getFormData() {
            return {
                hospitalName:       document.getElementById('hospName').value,
                hospitalType:       document.querySelector('input[name="hospType"]:checked')?.value,
                registrationNumber: document.getElementById('registrationNumber').value,
                city:               document.getElementById('city').value,
                contactNo:          document.getElementById('contactNo').value,
                officialEmail:      document.getElementById('officialEmail').value,
                adminName:          document.getElementById('adminName').value,
                designation:        document.getElementById('designation').value,
                adminEmail:         document.getElementById('adminEmail').value,
                // ✅ FIX #4: Include password in payload
                password:           document.getElementById('adminPassword').value,
                facultyServices: [
                    document.getElementById('facultyService1').value,
                    document.getElementById('facultyService2').value
                ].filter(s => s.trim() !== ''),
                departments:        selectedDepartments,
                hospitalLogo:       hospitalLogoData?.name || null,
                hospitalMainPhoto:  document.getElementById('hospitalMainPhoto').files[0]?.name || null,
                hospitalPhotos:     hospitalPhotosData.map(p => p.name),
                adminPhoto:         document.getElementById('adminPhoto').files[0]?.name || null,
                documents: {
                    regCertificate:  document.getElementById('regCertificate').files[0]?.name,
                    hospitalLicense: document.getElementById('hospitalLicense').files[0]?.name,
                    tradeLicense:    document.getElementById('tradeLicense').files[0]?.name,
                    panCard:         document.getElementById('panCard').files[0]?.name
                }
            };
        }

        // ─────────────────────────────────────────
        // HELPER: show / clear errors
        // ─────────────────────────────────────────
        function showError(elementId, message) {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.textContent = message;
            el.classList.add('show');
            const input = document.getElementById(elementId.replace('Error', ''));
            if (input) input.classList.add('is-invalid');
        }

        function clearError(elementId) {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.classList.remove('show');
            const input = document.getElementById(elementId.replace('Error', ''));
            if (input) input.classList.remove('is-invalid');
        }

        function clearAllErrors() {
            document.querySelectorAll('.invalid-feedback').forEach(el => {
                el.classList.remove('show');
                const input = document.getElementById(el.id.replace('Error', ''));
                if (input) input.classList.remove('is-invalid');
            });
        }

        function isValidEmail(email) {
            const normalized = sanitizeEmail(email);
            if (!normalized) return false;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
        }

        function sanitizeEmail(value) {
            return String(value || '')
                .normalize('NFKC')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .trim()
                .toLowerCase();
        }
    </script>
</body>
</html>`;

// ============================================
// API ENDPOINT HANDLER (used by home.js / router)
// ============================================
async function handleHospitalRegistration(reqBody, logoFile, mainPhotoFile, photosFiles, adminPhotoFile) {
    const client = await getClient();
    const fs = require('fs');
    const path = require('path');
    
    try {
        await client.query('BEGIN');

        const {
            hospitalName,
            hospitalType,
            registrationNumber,
            city,
            contactNo,
            officialEmail,
            adminName,
            designation,
            adminEmail,
            password,
            departments,
            facultyServices,
            documents 
        } = reqBody;

        const parseJsonArray = (value) => {
            if (Array.isArray(value)) return value;
            if (value === null || value === undefined || value === '') return [];
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (_) {
                return [];
            }
        };

        const parseJsonObject = (value) => {
            if (value && typeof value === 'object' && !Array.isArray(value)) return value;
            if (!value) return {};
            try {
                const parsed = JSON.parse(value);
                return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
            } catch (_) {
                return {};
            }
        };

        const departmentsArr = parseJsonArray(departments);
        const facultyServicesArr = parseJsonArray(facultyServices);
        const documentsObj = parseJsonObject(documents);

        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS main_photo_filename VARCHAR(255)`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255)`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS photo_filenames TEXT[]`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS departments TEXT[]`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS faculty_services TEXT[]`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS doc_reg_certificate TEXT`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS doc_hospital_license TEXT`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS doc_trade_license TEXT`);
        await client.query(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS doc_pan_card TEXT`);
        await client.query(`ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS photo_url TEXT`);

        // ✅ SAVE HOSPITAL LOGO TO DISK
        let logoFilename = null;
        if (logoFile) {
            const logoDir = path.join(__dirname, '..', 'uploads', 'hospitals', 'logos');
            if (!fs.existsSync(logoDir)) {
                fs.mkdirSync(logoDir, { recursive: true });
            }
            
            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(logoFile.originalname);
            logoFilename = `hospital_logo_${timestamp}${ext}`;
            const logoPath = path.join(logoDir, logoFilename);
            
            fs.writeFileSync(logoPath, logoFile.buffer);
        }

        // ✅ SAVE HOSPITAL PHOTOS TO DISK
        let mainPhotoFilename = null;
        if (mainPhotoFile) {
            const mainPhotoDir = path.join(__dirname, '..', 'uploads', 'hospitals', 'photos');
            if (!fs.existsSync(mainPhotoDir)) {
                fs.mkdirSync(mainPhotoDir, { recursive: true });
            }
            const timestamp = Date.now();
            const ext = path.extname(mainPhotoFile.originalname);
            mainPhotoFilename = `hospital_main_${timestamp}${ext}`;
            const mainPhotoPath = path.join(mainPhotoDir, mainPhotoFilename);
            fs.writeFileSync(mainPhotoPath, mainPhotoFile.buffer);
        }

        // ✅ SAVE HOSPITAL PHOTOS TO DISK
        let photoFilenames = [];
        if (photosFiles && photosFiles.length > 0) {
            const photosDir = path.join(__dirname, '..', 'uploads', 'hospitals', 'photos');
            if (!fs.existsSync(photosDir)) {
                fs.mkdirSync(photosDir, { recursive: true });
            }
            
            photosFiles.forEach(file => {
                const timestamp = Date.now();
                const ext = path.extname(file.originalname);
                const filename = `hospital_photo_${timestamp}_${Math.random().toString(36).substr(2, 9)}${ext}`;
                const filePath = path.join(photosDir, filename);
                
                fs.writeFileSync(filePath, file.buffer);
                photoFilenames.push(filename);
            });
        }
        if (!hospitalName || !adminEmail || !password) {
            return { success: false, error: 'Missing required fields.' };
        }

        // Insert hospital record
        const hospitalResult = await client.query(
            `INSERT INTO hospitals (hospital_uuid, name, type, registration_number, city, phone, email, departments, faculty_services, logo_filename, main_photo_filename, photo_filenames, doc_reg_certificate, doc_hospital_license, doc_trade_license, doc_pan_card)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING hospital_id, hospital_uuid`,
            [
                'HOSP-' + Date.now(),
                hospitalName,
                hospitalType,
                registrationNumber || null,
                city,
                contactNo || null,
                officialEmail,
                departmentsArr,
                facultyServicesArr,
                logoFilename,
                mainPhotoFilename,
                photoFilenames,
                documentsObj.regCertificate || null,
                documentsObj.hospitalLicense || null,
                documentsObj.tradeLicense || null,
                documentsObj.panCard || null
            ]
        );

        const hospitalId = hospitalResult.rows[0].hospital_id;
        const hospitalUuid = hospitalResult.rows[0].hospital_uuid;

        // ✅ FIX #4: Hash the user-supplied password instead of a hardcoded one
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const username = adminEmail.split('@')[0] + '_' + Date.now(); // ensure uniqueness

        // Create admin user account
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, hospital_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id`,
            [username, adminEmail, hashedPassword, 'admin', hospitalId]
        );
        const userId = userResult.rows[0].user_id;
        // Insert hospital admin profile
        let adminPhotoUrl = null;
        if (adminPhotoFile) {
            const adminPhotosDir = path.join(__dirname, '..', 'uploads', 'admins', 'photos');
            if (!fs.existsSync(adminPhotosDir)) {
                fs.mkdirSync(adminPhotosDir, { recursive: true });
            }
            const timestamp = Date.now();
            const ext = path.extname(adminPhotoFile.originalname);
            const adminFilename = `admin_photo_${timestamp}${ext}`;
            fs.writeFileSync(path.join(adminPhotosDir, adminFilename), adminPhotoFile.buffer);
            adminPhotoUrl = `/uploads/admins/photos/${adminFilename}`;
        }

        await client.query(
            `INSERT INTO hospital_admins (user_id, hospital_id, full_name, position, phone, email, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userResult.rows[0].user_id, hospitalId, adminName, designation, contactNo, adminEmail, adminPhotoUrl]
        );

        await client.query('COMMIT');

        return {
            success:    true,
            hospitalId: hospitalResult.rows[0].hospital_uuid,
            message:    'Hospital registered successfully'
        };

    } catch (error) {
        await client.query('ROLLBACK');
         if (error.code === '23505') {
            const detail = error.detail || '';
            if (detail.includes('email')) {
                return { success: false, error: 'This email is already registered.' };
            }
            if (detail.includes('username')) {
                return { success: false, error: 'Username already exists. Please try again.' };
            }
            return { success: false, error: 'A record with this data already exists.' };
        }

        console.error('Hospital registration DB error:', error.message);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// Export HTML renderer and the registration handler
module.exports = function renderHospitalRegistration() {
    return HTML_TEMPLATE;
};
module.exports.handleRegistration = handleHospitalRegistration;
module.exports.getHTMLTemplate = () => HTML_TEMPLATE;