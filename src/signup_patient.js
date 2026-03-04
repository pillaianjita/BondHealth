// signup_patient.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Default configuration
const defaultConfig = {
  page_title: 'Create Account',
  page_subtitle: 'Join us today and get started',
  button_text: 'Sign Up',
  terms_text: 'I agree to the Terms and Conditions',
  background_color: '#e0f2fe',
  surface_color: '#ffffff',
  text_color: '#1f2937',
  primary_action_color: '#38bdf8',
  secondary_action_color: '#0ea5e9',
  font_family: 'Outfit',
  font_size: 16
};

let config = { ...defaultConfig };
let users = [];

// Read signin.js file and extract the HTML template
function getSignInHTML() {
  try {
    const signinFilePath = path.join(__dirname, 'signin.js');
    const signinFileContent = fs.readFileSync(signinFilePath, 'utf8');
    
    // Extract the HTML_TEMPLATE using regex
    const templateMatch = signinFileContent.match(/const HTML_TEMPLATE = `([\s\S]*?)`;/);
    
    if (templateMatch && templateMatch[1]) {
      return templateMatch[1];
    } else {
      console.error('Could not extract HTML template from signin.js');
      return null;
    }
  } catch (error) {
    console.error('Error reading signin.js:', error.message);
    return null;
  }
}

// Password toggle functionality
function togglePassword() {
  return `
    <script>
      function togglePassword(inputId, eyeId) {
        const input = document.getElementById(inputId);
        const eye = document.getElementById(eyeId);
        if (input.type === 'password') {
          input.type = 'text';
          eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>';
        } else {
          input.type = 'password';
          eye.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
        }
      }
    </script>
  `;
}

// Form submission handler
function handleFormSubmission(formData) {
  const { password, confirmPassword, ...userData } = formData;
  
  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match'
    };
  }
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === userData.email);
  if (existingUser) {
    return {
      success: false,
      error: 'Email already registered'
    };
  }
  
  // Save user
  const newUser = {
    id: users.length + 1,
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  
  console.log('New user registered:', userData.email);
  
  return {
    success: true,
    message: 'Account created successfully!',
    redirectTo: '/signin'
  };
}

// Generate Sign Up HTML page - ONLY CHANGES MADE HERE AS REQUESTED
function generateSignUpHTML() {
  return `
<!doctype html>
<html lang="en" class="h-full">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.page_title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      box-sizing: border-box;
      font-family: '${config.font_family}', sans-serif;
      background: ${config.background_color} !important;
      color: ${config.text_color};
      font-size: ${config.font_size}px;
    }
    .form-input:focus {
      outline: none;
      border-color: ${config.primary_action_color};
      box-shadow: 0 0 0 3px ${config.primary_action_color}20;
    }
    .signup-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px ${config.primary_action_color}66;
    }
    .signup-btn:active {
      transform: translateY(0);
    }
    .password-toggle:hover {
      color: ${config.secondary_action_color};
    }
    #page-title {
      color: ${config.text_color};
      font-size: ${config.font_size * 1.875}px;
    }
    #page-subtitle {
      color: ${config.text_color}80;
      font-size: ${config.font_size}px;
    }
  </style>
 </head>
 <body class="h-full bg-gradient-to-br from-sky-100 via-white to-sky-50">
  <div class="h-full w-full overflow-auto">
   <div class="min-h-full flex items-center justify-center py-12 px-4">
    <div class="w-full max-w-lg">
     <!-- Header -->
     <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-sky-400 rounded-2xl mb-4 shadow-lg">
       <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewbox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
       </svg>
      </div>
      <h1 id="page-title" class="text-3xl font-bold text-gray-800 mb-2">${config.page_title}</h1>
      <p id="page-subtitle" class="text-gray-500">${config.page_subtitle}</p>
     </div>
     
     <!-- Form Card -->
     <div class="bg-white rounded-3xl shadow-xl p-8 border border-sky-100" style="background: ${config.surface_color};">
      <form id="signup-form" class="space-y-5">
       <!-- Name -->
       <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input type="text" id="name" name="name" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200" placeholder="Enter your full name">
       </div>
       
       <!-- Date of Birth -->
       <div>
        <label for="dob" class="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
        <input type="date" id="dob" name="dob" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200">
       </div>
       
       <!-- Gender -->
       <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
        <div class="flex gap-4">
         <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="gender" value="male" class="w-4 h-4 text-sky-400 border-gray-300 focus:ring-sky-400">
          <span class="text-gray-600">Male</span>
         </label>
         <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="gender" value="female" class="w-4 h-4 text-sky-400 border-gray-300 focus:ring-sky-400">
          <span class="text-gray-600">Female</span>
         </label>
         <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="gender" value="other" class="w-4 h-4 text-sky-400 border-gray-300 focus:ring-sky-400">
          <span class="text-gray-600">Other</span>
         </label>
        </div>
       </div>
       
       <!-- Blood Group Dropdown (ADDED) -->
       <div>
        <label for="blood_type" class="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
        <select id="blood_type" name="blood_type" class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200">
         <option value="">Select Blood Group</option>
         <option value="A+">A+</option>
         <option value="A-">A-</option>
         <option value="B+">B+</option>
         <option value="B-">B-</option>
         <option value="AB+">AB+</option>
         <option value="AB-">AB-</option>
         <option value="O+">O+</option>
         <option value="O-">O-</option>
         <option value="unknown">Unknown</option>
        </select>
       </div>
       
       <!-- Email (MOVED to after gender) -->
       <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input type="email" id="email" name="email" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200" placeholder="you@example.com">
       </div>
       
       <!-- Phone Number (MODIFIED for Indian format) -->
       <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <input type="tel" id="phone" name="phone" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200" placeholder="+91 98765 43210" pattern="[+][9][1][0-9]{10}" title="Please enter +91 followed by 10 digits">
       </div>
       
       <!-- Address -->
       <div>
        <label for="address" class="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea id="address" name="address" rows="2" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200 resize-none" placeholder="Enter your full address"></textarea>
       </div>
       
       <!-- Password -->
       <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Create Password</label>
        <div class="relative">
         <input type="password" id="password" name="password" required minlength="8" class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200 pr-12" placeholder="Min. 8 characters">
         <button type="button" onclick="togglePassword('password', 'eye1')" class="password-toggle absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors">
          <svg id="eye1" class="w-5 h-5" fill="none" stroke="currentColor" viewbox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
         </button>
        </div>
       </div>
       
       <!-- Confirm Password -->
       <div>
        <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <div class="relative">
         <input type="password" id="confirm-password" name="confirmPassword" required class="form-input w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 transition-all duration-200 pr-12" placeholder="Re-enter your password">
         <button type="button" onclick="togglePassword('confirm-password', 'eye2')" class="password-toggle absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors">
          <svg id="eye2" class="w-5 h-5" fill="none" stroke="currentColor" viewbox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
         </button>
        </div>
        <p id="password-error" class="text-red-500 text-sm mt-1 hidden"></p>
       </div>
       
       <!-- Terms and Conditions -->
       <div class="flex items-start gap-3">
        <input type="checkbox" id="terms" name="terms" required class="mt-1 w-4 h-4 text-sky-400 border-gray-300 rounded focus:ring-sky-400 cursor-pointer">
        <label for="terms" id="terms-label" class="text-sm text-gray-600 cursor-pointer">
         ${config.terms_text} <a href="#" class="text-sky-500 hover:text-sky-600 font-medium">Terms and Conditions</a> and <a href="#" class="text-sky-500 hover:text-sky-600 font-medium">Privacy Policy</a>
        </label>
       </div>
       
       <!-- Submit Button -->
       <button type="submit" id="submit-btn" class="signup-btn w-full py-4 bg-gradient-to-r from-sky-400 to-sky-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 mt-6" style="background: linear-gradient(to right, ${config.primary_action_color}, ${config.secondary_action_color});">
        ${config.button_text}
       </button>
      </form>
      
      <!-- Login Link - KEPT ON FORM PAGE (THIS IS THE ONLY SIGN IN LINK ON THE FORM PAGE) -->
     
      
      <!-- Success Message - NO TEXT LINK, ONLY BUTTON -->
      <div id="success-message" class="hidden text-center py-8">
       <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewbox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
       </div>
       <h3 class="text-xl font-semibold text-gray-800 mb-2">Account Created!</h3>
       <p class="text-gray-500 mb-6">Welcome aboard! Your account has been successfully created.</p>
       <a href="/signin" id="signin-success-btn" class="inline-block px-8 py-3 bg-gradient-to-r from-sky-400 to-sky-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
        Proceed to Sign In
       </a>
      </div>
     </div>
    </div>
   </div>
  </div>
  
  ${togglePassword()}
  
  <script>
    // Simple phone number formatting for Indian numbers (ADDED)
    document.getElementById('phone').addEventListener('input', function(e) {
      let value = this.value.replace(/\\D/g, '');
      if (value.length > 0 && !this.value.startsWith('+')) {
        if (value.length <= 10) {
          this.value = '+91' + value;
        }
      }
    });

    document.getElementById('signup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const phone = document.getElementById('phone').value;
      const errorEl = document.getElementById('password-error');
      
      if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
      }
      
      if (password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters';
        errorEl.classList.remove('hidden');
        return;
      }
      
      // Indian phone number validation (ADDED)
      const phoneRegex = /^\\+91[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        errorEl.textContent = 'Phone number must be +91 followed by 10 digits';
        errorEl.classList.remove('hidden');
        return;
      }
      
      errorEl.classList.add('hidden');
      
      // Disable submit button
      const submitBtn = document.getElementById('submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';
      
      // Prepare form data
      const formData = {
        name: document.getElementById('name').value,
        dob: document.getElementById('dob').value,
        gender: document.querySelector('input[name="gender"]:checked')?.value || '',
        blood_type: document.getElementById('blood_type').value, // ADDED
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value
      };
      
      // Submit via AJAX
      fetch('http://localhost:3005/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Hide form, show success message
          document.getElementById('signup-form').classList.add('hidden');
          document.getElementById('success-message').classList.remove('hidden');
        } else {
          errorEl.textContent = data.error || 'An error occurred';
          errorEl.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.textContent = '${config.button_text}';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = '${config.button_text}';
      });
    });
  </script>
 </body>
</html>
  `;
}

/*Routes
app.get('/', (req, res) => {
  res.send(generateSignUpHTML());
});

// Serve Sign In page
app.get('/signin', (req, res) => {
  const signInHTML = getSignInHTML();
  if (signInHTML) {
    res.send(signInHTML);
  } else {
    // Fallback error page
    res.status(404).send(`
      <html>
        <head><title>Sign In Not Found</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #ef4444;">❌ Sign In Page Not Found</h1>
          <p>Could not load signin.js template.</p>
          <p style="color: #6b7280; margin-top: 20px;">Make sure signin.js is in the same directory as this file.</p>
          <a href="/" style="display: inline-block; margin-top: 30px; padding: 10px 20px; background: #38bdf8; color: white; text-decoration: none; border-radius: 8px;">← Back to Sign Up</a>
        </body>
      </html>
    `);
  }
});

app.get('/config', (req, res) => {
  res.json(config);
});

app.post('/config', (req, res) => {
  const newConfig = req.body;
  config = { ...config, ...newConfig };
  res.json({ success: true, config });
});

app.post('/signup', (req, res) => {
  const result = handleFormSubmission(req.body);
  res.json(result);
});

app.get('/users', (req, res) => {
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json({ success: true, count: users.length, users: safeUsers });
});

// Start server
app.listen(port, () => {
  console.log('\n🚀 ========================================');
  console.log(`   Server running at http://localhost:${port}`);
  console.log('========================================\n');
  console.log('📝 Sign Up page: http://localhost:3000/');
  console.log('🔐 Sign In page: http://localhost:3000/signin');
  console.log('\n✅ Sign In options:');
  console.log('   • Form page: "Already have an account? Sign In" link ✓');
  console.log('   • Success page: "Proceed to Sign In" button ONLY ✓');
  console.log('   • NO text link on success page ✓\n');
  
  // Check if signin.js exists
  try {
    const signinPath = path.join(__dirname, 'signin.js');
    fs.accessSync(signinPath, fs.constants.F_OK);
    console.log('✅ signin.js found - Sign In page will be served at /signin');
  } catch (error) {
    console.log('⚠️  WARNING: signin.js NOT FOUND in current directory');
    console.log('   → Place signin.js in:', __dirname);
  }
  console.log('========================================\n');
});*/

module.exports = {
  defaultConfig,
  config,
  togglePassword,
  handleFormSubmission,
  generateSignUpHTML,
  users
};

// At the bottom of signup_patient.js, add:
module.exports = function renderPatientSignup() {
    return generateSignUpHTML();
};