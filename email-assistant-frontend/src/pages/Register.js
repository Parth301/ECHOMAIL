import React, { useState, useCallback, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { 
  LockOutlined, 
  VisibilityOutlined, 
  VisibilityOffOutlined, 
  EmailOutlined 
} from "@mui/icons-material";
import { motion, useAnimation } from "framer-motion";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Custom Theme (same as Login component)
const theme = createTheme({
  palette: {
    primary: {
      main: '#6a11cb',
      light: '#2575fc',
    },
    background: {
      default: '#f4f6f9'
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& label.Mui-focused': {
            color: '#6a11cb',
          },
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#6a11cb',
            },
          },
        },
      },
    },
  },
});

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const controls = useAnimation();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Error shake animation
  const shakeAnimation = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.3 }
    });
  };

  // Email validation
  const validateEmail = useCallback((email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        if (document.activeElement === emailInputRef.current) {
          passwordInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      await shakeAnimation();
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      await shakeAnimation();
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Success notification or modal can be added here
        navigate("/login");
      } else {
        setError(data.error || "Registration failed. Please try again.");
        await shakeAnimation();
      }
    } catch (err) {
      setError("Something went wrong. Try again later.");
      await shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Elements */}
        <Box 
          sx={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'rotate(45deg)',
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '350px',
            height: '350px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            transform: 'rotate(-45deg)',
          }}
        />

        <Container maxWidth="xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div animate={controls}>
              <Paper 
                elevation={24} 
                sx={{ 
                  p: 4, 
                  borderRadius: 4, 
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(15px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Stack spacing={3} alignItems="center">
                  <Box 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    }}
                  >
                    <LockOutlined sx={{ color: 'white', fontSize: 40 }} />
                  </Box>

                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color="text.primary" 
                    align="center"
                  >
                    Create Account
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    align="center"
                  >
                    Sign up to get started
                  </Typography>
                </Stack>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mt: 2, 
                      borderRadius: 2,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.05)' 
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleRegister}>
                  <Stack spacing={2.5} mt={3}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      variant="outlined"
                      type="email"
                      inputRef={emailInputRef}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlined color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2 
                        } 
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      variant="outlined"
                      type={showPassword ? "text" : "password"}
                      inputRef={passwordInputRef}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              aria-label="toggle password visibility"
                              size="small"
                            >
                              {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 2 
                        } 
                      }}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{ 
                          py: 1.5, 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          "Sign Up"
                        )}
                      </Button>
                    </motion.div>
                  </Stack>
                </form>

                <Typography 
                  variant="body2" 
                  align="center" 
                  sx={{ 
                    mt: 3, 
                    color: 'text.secondary' 
                  }}
                >
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      color: theme.palette.primary.main, 
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Login here
                  </Link>
                </Typography>
              </Paper>
            </motion.div>
          </motion.div>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Register;