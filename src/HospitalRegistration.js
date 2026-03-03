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
            .header-section {
                padding: 20px;
            }
            
            .logo-text {
                font-size: 1.8rem;
            }
            
            .page-title {
                font-size: 1.8rem;
            }
            
            .form-section {
                padding: 20px;
            }
            
            .departments-container {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .radio-group {
                flex-direction: column;
                gap: 10px;
            }
            
            .logo-upload-area {
                padding: 20px;
            }
            
            .logo-preview {
                width: 120px;
                height: 120px;
            }
            
            .btn-group {
                flex-direction: column;
                align-items: center;
            }
        }

        @media (max-width: 480px) {
            .departments-container {
                grid-template-columns: 1fr;
            }
            
            .logo {
                flex-direction: column;
                gap: 5px;
            }
            
            .logo-actions {
                flex-direction: column;
                align-items: center;
            }
            .remove-dept-btn {
                border: none;
                background: none;
                color: white;
                margin-left: 5px;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0 5px;
            }

            .remove-dept-btn:hover {
                opacity: 0.8;
                transform: scale(1.1);
            }
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

            <!-- Success Message (Hidden by default) -->
           <!-- In the success message section, replace the existing a tag with: -->


            <!-- Registration Form (Visible by default) -->
            <form id="hospitalRegistrationForm" class="registration-form">
                <!-- Hospital Logo/Photo Section -->
                <div class="form-section logo-upload-section">
                    <h3 class="section-title"><i class="fas fa-camera"></i> Hospital Logo & Photos</h3>
                    
                    <!-- Logo Preview -->
                    <div class="logo-preview-container">
                        <div class="logo-preview" id="logoPreview">
                            <div class="logo-preview-placeholder">
                                <i class="fas fa-hospital"></i>
                            </div>
                            <img id="logoPreviewImage" alt="Hospital Logo Preview">
                        </div>
                    </div>
                    
                    <!-- Logo Upload Area -->
                    <div class="logo-upload-area" id="logoUploadArea">
                        <input type="file" class="logo-input" id="hospitalLogo" accept=".jpg,.jpeg,.png,.gif,.svg">
                        <label for="hospitalLogo" class="logo-label">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <span>Click to upload Hospital Logo</span>
                            <div class="logo-note">Recommended: 500x500px, JPG/PNG format, Max 5MB</div>
                            <span class="logo-file-name" id="logoFileName">No file chosen</span>
                        </label>
                    </div>
                    
                    <!-- Logo Actions -->
                    <div class="logo-actions" id="logoActions" style="display: none;">
                        <button type="button" class="logo-action-btn btn-change-logo" onclick="document.getElementById('hospitalLogo').click()">
                            <i class="fas fa-sync-alt"></i> Change Logo
                        </button>
                        <button type="button" class="logo-action-btn btn-remove-logo" onclick="removeLogo()">
                            <i class="fas fa-trash"></i> Remove Logo
                        </button>
                    </div>
                    
                    <!-- Logo Specifications -->
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
                    
                    <!-- Hospital Photos Upload -->
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

                <!-- Location & Contact Section -->
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-map-marker-alt"></i> Location & Contact</h3>
                    
                    <div class="mb-4">
                        <label for="city" class="form-label required">City / Location</label>
                        <input type="text" class="form-control" id="city" placeholder="Enter city">
                        <div class="invalid-feedback" id="cityError">Please enter city/location.</div>
                    </div>
                    
                   <div class="col-md-6 mb-4">
    <label for="contactNo" class="form-label required">Contact Number</label>
    <input type="tel" class="form-control" id="contactNo" placeholder="+91 9876543210" 
           pattern="[0-9]{10}" maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" required>
    <div class="invalid-feedback" id="contactNoError">Please enter a valid 10-digit contact number.</div>
    <small class="text-muted">Enter 10-digit mobile number without country code</small>
</div>
                        
                        <div class="col-md-6 mb-4">
                            <label for="officialEmail" class="form-label required">Official Email</label>
                            <input type="email" class="form-control" id="officialEmail" placeholder="hospital@example.com">
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
                        <input type="email" class="form-control" id="adminEmail" placeholder="admin@example.com">
                        <div class="invalid-feedback" id="adminEmailError">Please enter a valid email address.</div>
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
            <!-- Departments will be added by JavaScript -->
        </div>
        
        <!-- Add Custom Department -->
        <div class="input-group mt-3">
            <input type="text" class="form-control" id="customDepartment" placeholder="Enter custom department">
            <button class="btn btn-outline-info" type="button" onclick="addCustomDepartment()">
                <i class="fas fa-plus"></i> Add Department
            </button>
        </div>
        
        <div class="invalid-feedback" id="departmentsError">Please select at least one department.</div>
        <div class="selected-departments mt-3">
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
                    <button type="submit" class="submit-btn">
                        <i class="fas fa-rocket"></i> Sign Up & Register Hospital
                    </button>
                    
                    <p class="terms-note">
                        By registering, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    </p>
                </div>
            </form>
        </div>

        <!-- Footer -->
        <!-- In the footer section, replace the existing back to sign in link with: -->
<div class="footer">
    <p>© 2024 BondHealth. All rights reserved. | <a href="/signin" style="color: var(--primary-blue); font-weight: 600;">← Back to Sign In</a>
</div>

    <!-- Bootstrap JS Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        // Department options
        const departmentOptions = [
            'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 
            'Gynecology', 'Dermatology', 'Emergency', 'Radiology',
            'General Surgery', 'Internal Medicine', 'Oncology', 'Psychiatry'
        ];

        // Selected departments array
        let selectedDepartments = [];
        
        // Hospital logo data
        let hospitalLogoData = null;
        let hospitalPhotosData = [];

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Render department chips
            renderDepartments();
            
            // Set up file upload handlers
            setupFileUploads();
            
            // Set up logo upload handlers
            setupLogoUpload();
            
            // Set up form submission
            setupFormSubmission();
            
            // Set up back button
            document.getElementById('backButton').addEventListener('click', resetForm);
        });

        // Set up logo upload functionality
        function setupLogoUpload() {
            const logoInput = document.getElementById('hospitalLogo');
            const logoPreview = document.getElementById('logoPreviewImage');
            const logoPlaceholder = document.querySelector('.logo-preview-placeholder');
            const logoUploadArea = document.getElementById('logoUploadArea');
            const logoFileName = document.getElementById('logoFileName');
            const logoActions = document.getElementById('logoActions');
            const hospitalPhotosInput = document.getElementById('hospitalPhotos');
            const hospitalPhotosPreview = document.getElementById('hospitalPhotosPreview');
            const hospitalPhotosName = document.getElementById('hospitalPhotosName');

            // Logo upload handler
            logoInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size exceeds 5MB limit. Please upload a smaller file.');
                        this.value = '';
                        return;
                    }
                    
                    // Validate file type
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
                    if (!validTypes.includes(file.type)) {
                        alert('Invalid file type. Please upload JPG, PNG, GIF, or SVG files.');
                        this.value = '';
                        return;
                    }
                    
                    // Read and display the image
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        hospitalLogoData = {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: e.target.result
                        };
                        
                        // Show preview
                        logoPreview.src = e.target.result;
                        logoPreview.style.display = 'block';
                        logoPlaceholder.style.display = 'none';
                        
                        // Update file name
                        logoFileName.textContent = file.name;
                        logoFileName.style.color = '#1565c0';
                        
                        // Show logo actions
                        logoActions.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Hospital photos upload handler
            hospitalPhotosInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    hospitalPhotosData = [];
                    const fileNames = [];
                    
                    // Clear previous preview
                    hospitalPhotosPreview.innerHTML = '';
                    
                    // Process each file
                    for (let i = 0; i < Math.min(this.files.length, 5); i++) { // Limit to 5 files
                        const file = this.files[i];
                        
                        // Validate file size (max 5MB each)
                        if (file.size > 5 * 1024 * 1024) {
                            alert(\`File "\${file.name}" exceeds 5MB limit. Skipping.\`);
                            continue;
                        }
                        
                        // Validate file type
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                        if (!validTypes.includes(file.type)) {
                            alert(\`Invalid file type for "\${file.name}". Please upload JPG or PNG files.\`);
                            continue;
                        }
                        
                        // Read and store the image
                        const reader = new FileReader();
                        reader.onload = (function(file) {
                            return function(e) {
                                hospitalPhotosData.push({
                                    name: file.name,
                                    type: file.type,
                                    size: file.size,
                                    data: e.target.result
                                });
                                
                                // Create preview thumbnail
                                const thumb = document.createElement('div');
                                thumb.className = 'photo-thumb';
                                
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.alt = file.name;
                                
                                const removeBtn = document.createElement('button');
                                removeBtn.className = 'remove-photo';
                                removeBtn.innerHTML = '×';
                                removeBtn.onclick = function() {
                                    thumb.remove();
                                    hospitalPhotosData = hospitalPhotosData.filter(p => p.name !== file.name);
                                    updatePhotosFileName();
                                    if (hospitalPhotosData.length === 0) {
                                        hospitalPhotosPreview.style.display = 'none';
                                    }
                                };
                                
                                thumb.appendChild(img);
                                thumb.appendChild(removeBtn);
                                hospitalPhotosPreview.appendChild(thumb);
                            };
                        })(file);
                        
                        reader.readAsDataURL(file);
                        fileNames.push(file.name);
                    }
                    
                    // Update file name display
                    updatePhotosFileName();
                    if (hospitalPhotosData.length > 0) {
                        hospitalPhotosPreview.style.display = 'flex';
                    }
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

            // Drag and drop for logo
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                logoUploadArea.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                logoUploadArea.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                logoUploadArea.addEventListener(eventName, unhighlight, false);
            });

            function highlight() {
                logoUploadArea.classList.add('dragover');
            }

            function unhighlight() {
                logoUploadArea.classList.remove('dragover');
            }

            logoUploadArea.addEventListener('drop', handleDrop, false);

            function handleDrop(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                
                if (files.length > 0) {
                    logoInput.files = files;
                    logoInput.dispatchEvent(new Event('change'));
                }
            }

            // Make the whole area clickable
            logoUploadArea.addEventListener('click', function(e) {
                if (e.target !== logoInput) {
                    logoInput.click();
                }
            });
        }

        // Remove logo function
        function removeLogo() {
            hospitalLogoData = null;
            const logoPreview = document.getElementById('logoPreviewImage');
            const logoPlaceholder = document.querySelector('.logo-preview-placeholder');
            const logoFileName = document.getElementById('logoFileName');
            const logoActions = document.getElementById('logoActions');
            
            // Reset preview
            logoPreview.style.display = 'none';
            logoPlaceholder.style.display = 'flex';
            logoFileName.textContent = 'No file chosen';
            logoFileName.style.color = '';
            logoActions.style.display = 'none';
            
            // Reset file input
            document.getElementById('hospitalLogo').value = '';
        }

        // Render department selection chips
        function renderDepartments() {
            const container = document.getElementById('departmentsContainer');
            container.innerHTML = '';
            
            departmentOptions.forEach(dept => {
                const chip = document.createElement('div');
                chip.className = 'department-chip';
                chip.textContent = dept;
                chip.addEventListener('click', () => toggleDepartment(dept));
                
                if (selectedDepartments.includes(dept)) {
                    chip.classList.add('selected');
                }
                
                container.appendChild(chip);
            });
            
            updateSelectedDepartmentsText();
        }

        // Toggle department selection
        function toggleDepartment(dept) {
            const index = selectedDepartments.indexOf(dept);
            
            if (index === -1) {
                selectedDepartments.push(dept);
            } else {
                selectedDepartments.splice(index, 1);
            }
            
            // Update UI
            renderDepartments();
            
            // Clear error if any
            clearError('departmentsError');
        }

        // Update selected departments text
        function updateSelectedDepartmentsText() {
            const textElement = document.getElementById('selectedDeptsText');
            if (selectedDepartments.length > 0) {
                textElement.textContent = selectedDepartments.join(', ');
            } else {
                textElement.textContent = 'None selected';
            }
        }

        // Set up file upload handlers
        function setupFileUploads() {
            const fileInputs = [
                { id: 'regCertificate', nameId: 'regCertificateName', areaId: 'regCertificateArea' },
                { id: 'hospitalLicense', nameId: 'hospitalLicenseName', areaId: 'hospitalLicenseArea' },
                { id: 'tradeLicense', nameId: 'tradeLicenseName', areaId: 'tradeLicenseArea' },
                { id: 'panCard', nameId: 'panCardName', areaId: 'panCardArea' }
            ];
            
            fileInputs.forEach(file => {
                const input = document.getElementById(file.id);
                const nameElement = document.getElementById(file.nameId);
                const area = document.getElementById(file.areaId);
                
                input.addEventListener('change', function() {
                    if (this.files.length > 0) {
                        nameElement.textContent = this.files[0].name;
                        nameElement.style.color = '#1565c0';
                        nameElement.style.fontWeight = '600';
                        
                        // Clear error if any
                        clearError(file.id + 'Error');
                    } else {
                        nameElement.textContent = 'No file chosen';
                        nameElement.style.color = '';
                        nameElement.style.fontWeight = '';
                    }
                });
                
                // Make the whole area clickable
                area.addEventListener('click', function(e) {
                    if (e.target !== input) {
                        input.click();
                    }
                });
            });
        }

// Function to add custom department
function addCustomDepartment() {
    const customDept = document.getElementById('customDepartment').value.trim();
    if (customDept && !selectedDepartments.includes(customDept)) {
        selectedDepartments.push(customDept);
        renderDepartments();
        document.getElementById('customDepartment').value = '';
        clearError('departmentsError');
    } else if (selectedDepartments.includes(customDept)) {
        alert('This department is already selected');
    } else {
        alert('Please enter a department name');
    }
}

// Updated renderDepartments function WITHOUT inline onclick (FIXED VERSION)
function renderDepartments() {
    const container = document.getElementById('departmentsContainer');
    container.innerHTML = '';
    
    // Combine predefined and custom departments
    const allDepartments = [...new Set([...departmentOptions, ...selectedDepartments])];
    
    allDepartments.forEach(dept => {
        const chip = document.createElement('div');
        chip.className = 'department-chip';
        
        if (selectedDepartments.includes(dept)) {
            chip.classList.add('selected');
            
            // Create text node for department name
            const deptText = document.createTextNode(dept);
            chip.appendChild(deptText);
            
            // Create remove button (NO inline onclick)
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-dept-btn';
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = 'border:none; background:none; color:white; margin-left:5px; font-size:1.2rem; cursor:pointer;';
            
            // Add click event using addEventListener (FIXED)
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering chip click
                removeDepartment(dept);
            });
            
            chip.appendChild(removeBtn);
        } else {
            chip.textContent = dept;
        }
        
        // Add click event to toggle department selection
        chip.addEventListener('click', function(e) {
            if (!e.target.classList.contains('remove-dept-btn')) {
                toggleDepartment(dept);
            }
        });
        
        container.appendChild(chip);
    });
    
    updateSelectedDepartmentsText();
}

// Function to remove department
function removeDepartment(dept) {
    const index = selectedDepartments.indexOf(dept);
    if (index > -1) {
        selectedDepartments.splice(index, 1);
        renderDepartments();
    }
}

        
        // Set up form submission
        function setupFormSubmission() {
              const form = document.getElementById('hospitalRegistrationForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
            submitBtn.disabled = true;
            
            try {
                // Collect form data
                const formData = getFormData();
                
                // Send to your API endpoint
                fetch('/api/hospitals/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Store hospital info in sessionStorage for the dashboard
                        sessionStorage.setItem('registeredHospital', JSON.stringify({
                            hospitalId: data.hospitalId,
                            hospitalName: formData.hospitalName,
                            registrationDate: new Date().toISOString()
                        }));
                        
                        // Show success message briefly
                        alert('Registration successful! Redirecting to dashboard...');
                        
                        // Redirect to Hospital Dashboard (port 3000)
                        window.location.href = 'http://localhost:3000/';
                    } else {
                        alert('Registration failed: ' + (data.error || 'Unknown error'));
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Registration failed. Please try again.');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                });
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });
}

        // Validate the form
        function validateForm() {
            let isValid = true;
            
            // Reset all errors
            clearAllErrors();
            
            // Hospital Name
            const hospName = document.getElementById('hospName').value.trim();
            if (!hospName) {
                showError('hospNameError', 'Please enter hospital name.');
                isValid = false;
            }
            
            // Hospital Type
            const hospType = document.querySelector('input[name="hospType"]:checked');
            if (!hospType) {
                showError('hospTypeError', 'Please select hospital type.');
                isValid = false;
            }
            
            // Registration Number
            const regNumber = document.getElementById('registrationNumber').value.trim();
            if (!regNumber) {
                showError('registrationNumberError', 'Please enter registration number.');
                isValid = false;
            }
            
            // City
            const city = document.getElementById('city').value.trim();
            if (!city) {
                showError('cityError', 'Please enter city/location.');
                isValid = false;
            }
            
            // Contact Number
            const contactNo = document.getElementById('contactNo').value.trim();
            if (!contactNo) {
                showError('contactNoError', 'Please enter contact number.');
                isValid = false;
            }

            // Add phone number validation
document.getElementById('contactNo').addEventListener('blur', function() {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.value)) {
        document.getElementById('contactNoError').textContent = 'Please enter a valid 10-digit number';
        document.getElementById('contactNoError').style.display = 'block';
        this.classList.add('is-invalid');
    } else {
        document.getElementById('contactNoError').style.display = 'none';
        this.classList.remove('is-invalid');
    }
});
            
            // Official Email
            const officialEmail = document.getElementById('officialEmail').value.trim();
            if (!officialEmail) {
                showError('officialEmailError', 'Please enter official email.');
                isValid = false;
            } else if (!isValidEmail(officialEmail)) {
                showError('officialEmailError', 'Please enter a valid email address.');
                isValid = false;
            }
            
            // Admin Name
            const adminName = document.getElementById('adminName').value.trim();
            if (!adminName) {
                showError('adminNameError', 'Please enter admin name.');
                isValid = false;
            }
            
            // Designation
            const designation = document.getElementById('designation').value.trim();
            if (!designation) {
                showError('designationError', 'Please enter designation.');
                isValid = false;
            }
            
            // Admin Email
            const adminEmail = document.getElementById('adminEmail').value.trim();
            if (!adminEmail) {
                showError('adminEmailError', 'Please enter admin email.');
                isValid = false;
            } else if (!isValidEmail(adminEmail)) {
                showError('adminEmailError', 'Please enter a valid email address.');
                isValid = false;
            }
            
            // Departments
            if (selectedDepartments.length === 0) {
                showError('departmentsError', 'Please select at least one department.');
                isValid = false;
            }
            
            // File uploads (basic check for demo)
            const files = [
                { id: 'regCertificate', errorId: 'regCertificateError' },
                { id: 'hospitalLicense', errorId: 'hospitalLicenseError' },
                { id: 'tradeLicense', errorId: 'tradeLicenseError' },
                { id: 'panCard', errorId: 'panCardError' }
            ];
            
            files.forEach(file => {
                const input = document.getElementById(file.id);
                if (input.files.length === 0) {
                    showError(file.errorId, \`Please upload \${file.id.replace(/([A-Z])/g, ' $1').toLowerCase()}.\`);
                    isValid = false;
                }
            });
            
            return isValid;
        }

        // Get form data as object
        function getFormData() {
            return {
                hospitalName: document.getElementById('hospName').value,
                hospitalType: document.querySelector('input[name="hospType"]:checked')?.value,
                registrationNumber: document.getElementById('registrationNumber').value,
                city: document.getElementById('city').value,
                contactNo: document.getElementById('contactNo').value,
                officialEmail: document.getElementById('officialEmail').value,
                adminName: document.getElementById('adminName').value,
                designation: document.getElementById('designation').value,
                adminEmail: document.getElementById('adminEmail').value,
                facultyServices: [
                    document.getElementById('facultyService1').value,
                    document.getElementById('facultyService2').value
                ].filter(service => service.trim() !== ''),
                departments: selectedDepartments,
                hospitalLogo: hospitalLogoData?.name || null,
                hospitalPhotos: hospitalPhotosData.map(photo => photo.name),
                documents: {
                    regCertificate: document.getElementById('regCertificate').files[0]?.name,
                    hospitalLicense: document.getElementById('hospitalLicense').files[0]?.name,
                    tradeLicense: document.getElementById('tradeLicense').files[0]?.name,
                    panCard: document.getElementById('panCard').files[0]?.name
                }
            };
        }

        // Reset form after success
        function resetForm() {
            // Hide success message
            document.getElementById('successMessage').classList.remove('show');
            
            // Show form
            document.getElementById('hospitalRegistrationForm').style.display = 'block';
            
            // Reset form fields
            document.getElementById('hospitalRegistrationForm').reset();
            
            // Reset departments
            selectedDepartments = [];
            renderDepartments();
            
            // Reset logo
            removeLogo();
            
            // Reset photos
            hospitalPhotosData = [];
            document.getElementById('hospitalPhotosPreview').innerHTML = '';
            document.getElementById('hospitalPhotosPreview').style.display = 'none';
            document.getElementById('hospitalPhotosName').textContent = 'No files chosen';
            document.getElementById('hospitalPhotosName').style.color = '';
            
            // Reset file names
            ['regCertificateName', 'hospitalLicenseName', 'tradeLicenseName', 'panCardName'].forEach(id => {
                document.getElementById(id).textContent = 'No file chosen';
                document.getElementById(id).style.color = '';
                document.getElementById(id).style.fontWeight = '';
            });
            
            // Reset submit button
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Sign Up & Register Hospital';
            submitBtn.disabled = false;
            
            // Clear all errors
            clearAllErrors();
        }

        // Helper functions
        function showError(elementId, message) {
            const element = document.getElementById(elementId);
            element.textContent = message;
            element.classList.add('show');
            
            // Add error class to corresponding input if it exists
            const inputId = elementId.replace('Error', '');
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.add('is-invalid');
            }
        }

        function clearError(elementId) {
            const element = document.getElementById(elementId);
            element.classList.remove('show');
            
            // Remove error class from corresponding input if it exists
            const inputId = elementId.replace('Error', '');
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.remove('is-invalid');
            }
        }

        function clearAllErrors() {
            const errorElements = document.querySelectorAll('.invalid-feedback');
            errorElements.forEach(element => {
                element.classList.remove('show');
                
                const inputId = element.id.replace('Error', '');
                const input = document.getElementById(inputId);
                if (input) {
                    input.classList.remove('is-invalid');
                }
            });
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
        }
    </script>
</body>
</html>`;

// Data storage for registered hospitals (in-memory for demo)
/*let registeredHospitals = [];

const server = http.createServer((req, res) => {
    // Serve the main registration page
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
        });
        res.end(HTML_TEMPLATE);
    }
    
    // API endpoint for hospital registration
    else if (req.url === '/api/hospitals/register' && req.method === 'POST') {
        
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const formData = new URLSearchParams(body);

        const hospitalData = {
            hospitalName: formData.get('hospName'),
            hospitalId: 'HOSP-' + Date.now()
        };

        // Here we generate dynamic HTML
        const html = hospitalPage(hospitalData);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
    }
    
    // API endpoint to get all registered hospitals
    else if (req.url === '/api/hospitals' && req.method === 'GET') {
        res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(registeredHospitals));
    }
    
    // API endpoint to get a specific hospital
    else if (req.url.startsWith('/api/hospitals/') && req.method === 'GET') {
        const id = req.url.split('/').pop();
        const hospital = registeredHospitals.find(h => h.hospitalId === id);
        
        if (hospital) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(hospital));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Hospital not found' }));
        }
    }
    
    // Handle CORS preflight requests
    else if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
    }
    
    // 404 for any other routes
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});
*/
// ============================================
// API ENDPOINT HANDLER (to be used by home.js)
// ============================================
async function handleHospitalRegistration(reqBody) {
    const client = await getClient();
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
            departments
        } = reqBody;
        
        // Insert hospital
        const hospitalResult = await client.query(
            `INSERT INTO hospitals (hospital_uuid, name, type, city, phone, email)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING hospital_id, hospital_uuid`,
            ['HOSP-' + Date.now(), hospitalName, hospitalType, city, contactNo, officialEmail]
        );
        
        const hospitalId = hospitalResult.rows[0].hospital_id;
        
        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt); // Temporary password
        
        const userResult = await client.query(
            `INSERT INTO users (username, email, password_hash, role, hospital_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id`,
            [adminEmail.split('@')[0], adminEmail, hashedPassword, 'admin', hospitalId]
        );
        
        // Insert hospital admin
        await client.query(
            `INSERT INTO hospital_admins (user_id, hospital_id, full_name, position, phone, email)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userResult.rows[0].user_id, hospitalId, adminName, designation, contactNo, adminEmail]
        );
        
        await client.query('COMMIT');
        
        return {
            success: true,
            hospitalId: hospitalResult.rows[0].hospital_uuid,
            message: 'Hospital registered successfully'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Hospital registration error:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        client.release();
    }
}

// Export both the template and the handler
module.exports = function renderHospitalRegistration() {
    return HTML_TEMPLATE;
};
module.exports.handleRegistration = handleHospitalRegistration;

// At the bottom of HospitalRegistration.js, add:



// server.listen(PORT, () => {
//     console.log(`✅ Hospital Registration Portal running at:`);
//     console.log(`   🌐 http://localhost:${PORT}`);
//     console.log(`   📁 Single file: HospitalRegistration.js`);
//     console.log(`   🚀 No dependencies required!`);
//     console.log(`   📝 Registration Form: http://localhost:${PORT}`);
//     console.log(`   🔗 Back to Sign In: http://localhost:3001/ (if signin.js is running)`);
//     console.log(`   📊 Total registered hospitals: 0`);
// });