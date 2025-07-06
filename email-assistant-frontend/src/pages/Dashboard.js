import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Container, 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button,
  IconButton,
  Skeleton,
  useMediaQuery,
  Snackbar,
  Alert,
  Divider
} from "@mui/material";
import { 
  BarChart as BarChartIcon,
  EmailOutlined,
  SendOutlined,
  CreateOutlined,
  AutoFixHighOutlined,
  LogoutOutlined,
  RefreshOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  TrendingUpOutlined
} from "@mui/icons-material";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Area,
  AreaChart
} from "recharts";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import api from "../api";

// Updated style constants with more modern gradients
const styles = {
  gradientBackground: {
    lightMode: 'linear-gradient(120deg, #f8f9fa 0%, #e9ecef 100%)',
    darkMode: 'linear-gradient(120deg, #151515 0%, #1e1e1e 100%)'
  },
  cardGradient: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  shadows: {
    card: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    hover: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  borderRadius: {
    default: 5,
    large: 0
  },
  transitions: {
    default: 'all 0.3s ease'
  }
};

// Enhanced theme without high contrast
const getTheme = (darkMode) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#047857',
      contrastText: '#ffffff'
    },
    background: {
      default: darkMode ? '#0f172a' : '#f8fafc',
      paper: darkMode ? '#1e293b' : '#ffffff'
    },
    text: {
      primary: darkMode ? '#f8fafc' : '#0f172a',
      secondary: darkMode ? '#cbd5e1' : '#475569'
    },
    error: {
      main: '#ef4444'
    },
    warning: {
      main: '#f59e0b'
    },
    info: {
      main: '#0ea5e9'
    },
    success: {
      main: '#10b981'
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
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em'
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em'
    },
    button: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
          }
        },
        containedPrimary: {
          background: styles.cardGradient.primary,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            background: styles.cardGradient.primary,
            transform: 'translateY(-2px)'
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: styles.borderRadius.default,
          transition: styles.transitions.default
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        },
        elevation3: {
          boxShadow: styles.shadows.card
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: styles.borderRadius.default,
          overflow: 'hidden'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500
        }
      }
    }
  }
});


// Chart error boundary with better error UI
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          textAlign="center" 
          py={4} 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
          height={300}
          sx={{ 
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider'
          }}
        >
          <Typography color="error" gutterBottom variant="subtitle1">
            Chart failed to render
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshOutlined />}
            onClick={() => this.setState({ hasError: false })}
            size="small"
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

ChartErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

// Improved skeleton loader
const DashboardSkeleton = () => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={8}>
      <Skeleton variant="rounded" height={90} animation="wave" sx={{ mb: 3 }} />
    </Grid>
    <Grid item xs={12} md={4}>
      <Skeleton variant="rounded" height={90} animation="wave" sx={{ mb: 3 }} />
    </Grid>
    <Grid item xs={12} md={4}>
      <Skeleton variant="rounded" height={120} animation="wave" />
    </Grid>
    <Grid item xs={12} md={8}>
      <Skeleton variant="rounded" height={120} animation="wave" />
    </Grid>
    <Grid item xs={12} md={8}>
      <Skeleton variant="rounded" height={350} animation="wave" />
    </Grid>
    <Grid item xs={12} md={4}>
      <Skeleton variant="rounded" height={350} animation="wave" />
    </Grid>
  </Grid>
);

// Enhanced Quick Action Card
const QuickActionCard = ({ to, title, description, icon: Icon, color = "primary" }) => {
  const gradientMap = {
    primary: styles.cardGradient.primary,
    secondary: styles.cardGradient.secondary,
    success: styles.cardGradient.success
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.03, boxShadow: styles.shadows.hover }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={to} style={{ textDecoration: 'none' }} aria-label={title}>
        <Paper 
          sx={{ 
            background: gradientMap[color] || gradientMap.primary,
            color: 'white',
            borderRadius: styles.borderRadius.default,
            boxShadow: styles.shadows.card,
            height: '100%',
            p: 2.5,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            display="flex" 
            alignItems="flex-start" 
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {description}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                borderRadius: '50%', 
                p: 1.5
              }}
            >
              <Icon sx={{ fontSize: 30 }} />
            </Box>
          </Box>
          <Box 
            sx={{
              position: 'absolute',
              bottom: -15,
              right: -15,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }}
          />
        </Paper>
      </Link>
    </motion.div>
  );
};

QuickActionCard.propTypes = {
  to: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success'])
};

// Analytics Summary
const AnalyticsSummary = ({ analytics, colors, trendData, theme }) => {
  const conversionRate = useMemo(() => {
    return (analytics.generated_count + analytics.refined_count) > 0
      ? Math.round((analytics.sent_count / (analytics.generated_count + analytics.refined_count)) * 100)
      : 0;
  }, [analytics]);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: styles.borderRadius.default, 
        p: { xs: 2, sm: 3 }, // Responsive padding
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between" 
        mb={2}
        flexWrap="wrap" // Allow wrapping on small screens
        gap={1} // Add gap when items wrap
      >
        <Typography 
          variant="h6" 
          fontWeight="bold"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }, // Responsive font size
            
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: { xs: '100%', sm: '70%' } // Limit width on small screens
          }}
        >
          Campaign Performance
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'rgba(16, 185, 129, 0.1)', 
            color: 'success.main',
            borderRadius: 2,
            py: 0.5,
            px: 1.5,
            maxWidth: { xs: '100%', sm: 'auto' } // Full width on mobile
          }}
        >
          <TrendingUpOutlined sx={{ fontSize: 18, mr: 0.5, flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            fontWeight="medium"
            sx={{ 
              whiteSpace: 'nowrap',
              
              textOverflow: 'ellipsis'
            }}
          >
            {conversionRate}% Conversion
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={1} sx={{ mb: 2 }}>
        {/* Generated Card */}
        <Grid item xs={4}>
          <Box 
            sx={{ 
              p: { xs: 1, sm: 1.5 }, // Responsive padding
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'light' ? '#e4f2ff' : 'rgba(30, 41, 59, 0.7)',
              height: '100%'
            }}
          >
            <Box display="flex" alignItems="center" mb={0.5}>
              <Box 
                sx={{ 
                  bgcolor: `rgba(${colors[0].replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`, 
                  color: colors[0],
                  p: 0.7,
                  borderRadius: '50%',
                  mr: 1,
                  display: 'flex',
                  flexShrink: 0 // Prevent icon from shrinking
                }}
              >
                <CreateOutlined fontSize="small" />
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  
                  textOverflow: 'ellipsis',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } // Responsive font
                }}
              >
                Generated
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
                whiteSpace: 'nowrap',
                
                textOverflow: 'ellipsis'
              }}
            >
              {analytics.generated_count}
            </Typography>
          </Box>
        </Grid>
        
        {/* Refined Card */}
        <Grid item xs={4}>
          <Box 
            sx={{ 
              p: { xs: 1, sm: 1.5 }, // Responsive padding
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'light' ? '#e4f2ff' : 'rgba(30, 41, 59, 0.7)',
              height: '100%'
            }}
          >
            <Box display="flex" alignItems="center" mb={0.5}>
              <Box 
                sx={{ 
                  bgcolor: `rgba(${colors[1].replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`, 
                  color: colors[1],
                  p: 0.7,
                  borderRadius: '50%',
                  mr: 1,
                  display: 'flex',
                  flexShrink: 0 // Prevent icon from shrinking
                }}
              >
                <AutoFixHighOutlined fontSize="small" />
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  
                  textOverflow: 'ellipsis',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } // Responsive font
                }}
              >
                Refined
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
                whiteSpace: 'nowrap',
                
                textOverflow: 'ellipsis'
              }}
            >
              {analytics.refined_count}
            </Typography>
          </Box>
        </Grid>
        
        {/* Sent Card */}
        <Grid item xs={4}>
          <Box 
            sx={{ 
              p: { xs: 1, sm: 1.5 }, // Responsive padding
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'light' ? '#e4f2ff' : 'rgba(30, 41, 59, 0.7)',
              height: '100%'
            }}
          >
            <Box display="flex" alignItems="center" mb={0.5}>
              <Box 
                sx={{ 
                  bgcolor: `rgba(${colors[2].replace('#', '').match(/../g).map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`, 
                  color: colors[2],
                  p: 0.7,
                  borderRadius: '50%',
                  mr: 1,
                  display: 'flex',
                  flexShrink: 0 // Prevent icon from shrinking
                }}
              >
                <SendOutlined fontSize="small" />
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  whiteSpace: 'nowrap',
                  
                  textOverflow: 'ellipsis',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } // Responsive font
                }}
              >
                Sent
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
                whiteSpace: 'nowrap',
                
                textOverflow: 'ellipsis'
              }}
            >
              {analytics.sent_count}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Conversion Trend
        </Typography>
      </Box>
      
      <Box height={90} mt={1}>  {/* Slightly increased height */}
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart 
      data={trendData} 
      margin={{ top: 0, right: 15, left: 15, bottom: 16 }}  // Increased side margins and bottom margin
    >
      <defs>
        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <XAxis 
  dataKey="name" 
  axisLine={false}
  tickLine={false}
  interval={0}  // Display all ticks without skipping
  tickMargin={2}  // Minimum tick margin
  tick={(props) => {
    const { x, y, payload } = props;
    // Custom rendering for tick labels with larger font
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={10}
          textAnchor="middle" 
          fill={theme.palette.text.secondary} // Use theme's text color instead of hardcoded color
          fontSize={16}  // Increased font size
          fontWeight="520"  // Bold text
          style={{ letterSpacing: '-0.3px' }}  // Slightly reduced letter spacing compression
        >
          {payload.value.substring(0, 3)}  {/* Show first 3 chars of day name */}
        </text>
      </g>
    );
  }}
/>
      <Area 
        type="monotone" 
        dataKey="value" 
        stroke="#10b981" 
        strokeWidth={2}
        fill="url(#colorTrend)" 
      />
      <Tooltip
        contentStyle={{ 
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          color: '#f8fafc',
          borderRadius: 8,
          border: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }}
        formatter={(value) => [`${value}`, 'Conversion']}
        labelFormatter={(label) => `Day: ${label}`}
      />
    </AreaChart>
  </ResponsiveContainer>
</Box>
      
    </Paper>
  );
};

AnalyticsSummary.propTypes = {
  analytics: PropTypes.shape({
    total_emails: PropTypes.number.isRequired,
    generated_count: PropTypes.number.isRequired,
    refined_count: PropTypes.number.isRequired,
    sent_count: PropTypes.number.isRequired
  }).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  trendData: PropTypes.array,
  theme: PropTypes.object.isRequired
};

// Bar Chart Component
const EmailBarChart = React.memo(({ data, colors }) => (
  <ChartErrorBoundary>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
      >
        <defs>
          {colors.map((color, index) => (
            <linearGradient 
              key={`gradient-${index}`}
              id={`barGradient${index}`} 
              x1="0" 
              y1="0" 
              x2="0" 
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.4}/>
            </linearGradient>
          ))}
        </defs>
        <XAxis 
  dataKey="name" 
  axisLine={false}
  tickLine={false}
  dy={10}
  tick={props => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="#94a3b8" 
          fontSize={11}
          style={{ wordWrap: 'break-word' }}
        >
          {payload.value}
        </text>
      </g>
    );
  }}
/>
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          dx={-10}
          // Allow wider margins for y-axis text
          width={40}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            color: '#f8fafc',
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}
          cursor={{ opacity: 0.3 }}
          labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
          itemStyle={{ color: '#f8fafc' }} // Add explicit color for tooltip items
        />
        <Bar 
          dataKey="count" 
          fill={`url(#barGradient0)`}
          radius={[8, 8, 0, 0]}
          barSize={40}
          animationDuration={1200}
        />
      </BarChart>
    </ResponsiveContainer>
  </ChartErrorBoundary>
));

EmailBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired
};

// Pie Chart Component
const EmailPieChart = React.memo(({ data, colors }) => (
  <ChartErrorBoundary>
    {data.some(item => item.value > 0) ? (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <defs>
            {colors.map((color, index) => (
              <linearGradient 
                key={`gradient-${index}`}
                id={`pieGradient${index}`} 
                x1="0" 
                y1="0" 
                x2="0" 
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={1}/>
                <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            innerRadius={40}
            paddingAngle={3}
            fill="#8884d8"
            dataKey="value"
            // Improved label formatting to prevent overflow
            label={({ name, percent }) => {
              if (percent < 0.05) return null;
              // Truncate long names
              const shortenedName = name.length > 8 ? `${name.substring(0, 8)}...` : name;
              return `${shortenedName} ${(percent * 100).toFixed(0)}%`;
            }}
            animationDuration={1000}
            animationBegin={200}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient${index % colors.length})`}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              color: '#f8fafc',
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: '200px',      // Limit tooltip width
              whiteSpace: 'normal',   // Allow text wrapping
                   // Hide overflow
              textOverflow: 'ellipsis' // Show ellipsis for overflow
            }}
            formatter={(value, name) => {
              const percentage = (value / data.reduce((sum, item) => sum + item.value, 0) * 100).toFixed(1);
              return [`${value} (${percentage}%)`, name];
            }}
            labelStyle={{ 
              color: '#f8fafc', 
              fontWeight: 'bold',
              
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            itemStyle={{ 
              color: '#f8fafc',
              
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          />
          <Legend 
            iconType="circle" 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: 20 }}
            // Fixed legend text overflow
            formatter={(value) => {
              return (
                <span style={{ 
                  color: '#64748b', 
                  maxWidth: '80px',      // Limit width
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  
                  textOverflow: 'ellipsis',
                  verticalAlign: 'middle'
                }}>
                  {value}
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
        <EmailOutlined sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="body1" color="textSecondary" align="center" fontWeight="medium">
          No email data available
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 250, mt: 1 }}>
          Start creating campaigns to visualize your email analytics here
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          size="small" 
          component={Link} 
          to="/email-generation"
          sx={{ mt: 2 }}
        >
          Create Your First Campaign
        </Button>
      </Box>
    )}
  </ChartErrorBoundary>
));

EmailPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired
    })
  ).isRequired,
  colors: PropTypes.arrayOf(PropTypes.string).isRequired
};

// Dashboard Main Component
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState({ 
    total_emails: 0, 
    generated_count: 0, 
    refined_count: 0, 
    sent_count: 0 
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  }); 

  // Check if device is mobile
  const isMobile = useMediaQuery('(max-width:600px)');

  // Create theme
  const theme = useMemo(() => getTheme(darkMode), [darkMode]);

  // Fixed colors for charts
  const COLORS = useMemo(() => ['#60a5fa', '#34d399', '#fbbf24'], []);

  // Handle theme toggle
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    
    setSnackbar({
      open: true,
      message: 'Successfully logged out',
      severity: 'info'
    });
    
    setTimeout(() => navigate("/login"), 1000);
  }, [navigate]);

  // Handle snackbar close
  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Fetch analytics data
 const fetchAnalytics = useCallback(async () => {
  try {
    setIsLoading(true);

    const response = await api.post("/api/analytics", {}); // ✅ Axios handles headers & baseURL

    const data = response.data;

    const processedData = {
      total_emails: Number(data.total_emails) || 0,
      generated_count: Number(data.generated_count) || 0,
      refined_count: Number(data.refined_count) || 0,
      sent_count: Number(data.sent_count) || 0,
      trendData: (data.trend || []).map(entry => ({
        name: entry.day,
        value: entry.count
      }))
    };

    setAnalytics(processedData);
    setError(null);

  } catch (error) {
    console.error("❌ Error fetching analytics:", error);

    if (error.response?.status === 401 || error.response?.status === 403) {
      setError("Authentication expired. Please login again.");
      handleLogout();
    } else {
      setError(error.response?.data?.error || "Failed to load analytics data");
    }

  } finally {
    setIsLoading(false);
  }
}, [handleLogout]);

  // Always fetch fresh data when component mounts or when location changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, location]);

  // Precompute chart data
  const barChartData = useMemo(() => [
    { name: "Generated", count: analytics.generated_count },
    { name: "Refined", count: analytics.refined_count },
    { name: "Sent", count: analytics.sent_count },
    { name: "Total", count: analytics.total_emails }
  ], [analytics]);

  const pieChartData = useMemo(() => [
    { name: "Generated", value: analytics.generated_count },
    { name: "Refined", value: analytics.refined_count },
    { name: "Sent", value: analytics.sent_count }
  ], [analytics]);

return (
  <ThemeProvider theme={theme}>
    <Box 
      sx={{ 
        background: darkMode ? styles.gradientBackground.darkMode : styles.gradientBackground.lightMode,
        minHeight: '100vh',
        py: 4,
        px: { xs: 2, sm: 3 },
        transition: 'background 0.3s ease-in-out'
      }}
    >
      <Container maxWidth="lg">
        {/* Header section with app title and action buttons */}
        <Box 
          mb={4} 
          sx={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: 2
          }}
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold', 
                color: 'primary.main',
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box 
                sx={{
                  display: 'inline-flex',
                  mr: 1.5,
                  p: 1,
                  borderRadius: '12px',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(99, 102, 241, 0.2)' 
                    : 'rgba(99, 102, 241, 0.1)',
                }}
              >
                <BarChartIcon sx={{ color: 'primary.main' }} />
              </Box>
              Email Campaign Dashboard
            </Typography>
          </motion.div>
          
          {/* Control buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1,
              ml: 'auto' 
            }}
          >
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <IconButton 
                onClick={toggleDarkMode} 
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Light mode" : "Dark mode"}
                size={isMobile ? "small" : "medium"}
                color="primary"
                sx={{ 
                  bgcolor: 'background.paper', 
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.default' }
                }}
              >
                {darkMode ? <LightModeOutlined fontSize={isMobile ? "small" : "medium"} /> : <DarkModeOutlined fontSize={isMobile ? "small" : "medium"} />}
              </IconButton>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<LogoutOutlined />}
                onClick={handleLogout}
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  boxShadow: theme.shadows[3],
                  minWidth: isMobile ? 'auto' : undefined,
                  '& .MuiButton-startIcon': {
                    mr: isMobile ? 0 : undefined
                  }
                }}
              >
                {isMobile ? '' : 'Logout'}
              </Button>
            </motion.div>
          </Box>
        </Box>

        {/* Error message with retry option */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: styles.borderRadius.default,
                '& .MuiAlert-icon': {
                  fontSize: 20
                }
              }}
              action={
                <Button 
                  color="inherit" 
                  size="small" 
                  startIcon={<RefreshOutlined />}
                  onClick={fetchAnalytics}
                  variant="outlined"
                  sx={{ borderRadius: 6 }}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Dashboard content */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <Grid container spacing={3}>
            {/* Quick action cards in row */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <QuickActionCard 
                  to="/email-generation" 
                  title="New Campaign" 
                  description="Create and launch an email campaign" 
                  icon={EmailOutlined} 
                  color="primary"
                />
              </motion.div>
            </Grid>
  
            {/* Analytics Summary */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <AnalyticsSummary 
                analytics={analytics} 
                colors={COLORS} 
                trendData={analytics.trendData || []}
                theme={theme}
                />
              </motion.div>
            </Grid>

            {/* Bar Chart */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    borderRadius: styles.borderRadius.default, 
                    p: 3,
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold" sx={{ ml: '50px' }}>
                      Email Campaign Analytics
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={fetchAnalytics}
                      title="Refresh data"
                      sx={{ 
                        bgcolor: 'background.default',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <RefreshOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                  <EmailBarChart data={barChartData} colors={COLORS} />
                </Paper>
              </motion.div>
            </Grid>

            {/* Pie Chart */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    borderRadius: styles.borderRadius.default, 
                    p: 3,
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Email Distribution
                  </Typography>
                  <EmailPieChart data={pieChartData} colors={COLORS} />
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {/* Footer section with version info */}
        <Box 
          mt={6} 
          display="flex" 
          justifyContent="center" 
          alignItems="center"
          color="text.secondary"
        >
          <Typography variant="body2" fontSize="0.75rem">
            Email Campaign Dashboard v2.1 &copy; {new Date().getFullYear()}
          </Typography>
        </Box>
      </Container>

      {/* Global snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiAlert-root': {
            borderRadius: styles.borderRadius.default
          }
        }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: theme.shadows[6]
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  </ThemeProvider>
);
};

export default Dashboard;
