import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

// --- OOP Classes for Data Management ---

// A simple class to manage User data and authentication logic
class User {
  constructor(name, email, password) {
    this.id = email; // Using email as a unique ID
    this.name = name;
    this.email = email;
    this.password = password; // In a real app, this would be hashed
    this.createdAt = new Date();
  }
}

// Service to handle all authentication operations and localStorage interaction for users
class AuthService {
  constructor() {
    this.usersKey = "finance_dashboard_users";
    this.sessionKey = "finance_dashboard_session";
    this.users = this._getUsersFromStorage();
  }

  _getUsersFromStorage() {
    try {
      const users = localStorage.getItem(this.usersKey);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error("Failed to parse users from localStorage", error);
      return [];
    }
  }

  _saveUsersToStorage() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }

  register(name, email, password) {
    const userExists = this.users.find((user) => user.email === email);
    if (userExists) {
      throw new Error("User with this email already exists.");
    }
    const newUser = new User(name, email, password);
    this.users.push(newUser);
    this._saveUsersToStorage();
    return this.login(email, password);
  }

  login(email, password) {
    const user = this.users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      throw new Error("Invalid email or password.");
    }
    sessionStorage.setItem(this.sessionKey, JSON.stringify(user));
    return user;
  }

  logout() {
    sessionStorage.removeItem(this.sessionKey);
  }

  getCurrentUser() {
    try {
      const user = sessionStorage.getItem(this.sessionKey);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Failed to parse current user from sessionStorage", error);
      return null;
    }
  }
}

// Service to handle all data operations (transactions, goals) for a specific user
class DataService {
  constructor(userId) {
    if (!userId)
      throw new Error("DataService requires a userId to initialize.");
    this.transactionsKey = `transactions_${userId}`;
    this.goalsKey = `goals_${userId}`;
  }

  // --- Transactions ---
  getTransactions() {
    const data = localStorage.getItem(this.transactionsKey);
    return data ? JSON.parse(data) : [];
  }

  addTransaction(transactionData) {
    const transactions = this.getTransactions();
    const newTransaction = {
      id: Date.now(),
      ...transactionData,
    };
    transactions.unshift(newTransaction);
    localStorage.setItem(this.transactionsKey, JSON.stringify(transactions));
    return newTransaction;
  }

  // --- Goals ---
  getGoals() {
    const data = localStorage.getItem(this.goalsKey);
    return data ? JSON.parse(data) : [];
  }

  addGoal(goalData) {
    const goals = this.getGoals();
    const newGoal = {
      id: Date.now(),
      savedAmount: 0,
      ...goalData,
    };
    goals.push(newGoal);
    localStorage.setItem(this.goalsKey, JSON.stringify(goals));
    return newGoal;
  }

  // --- Summary Calculations ---
  getSummary() {
    const transactions = this.getTransactions();
    const summary = transactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") {
          acc.income += tx.amount;
        } else {
          acc.expenses += tx.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 }
    );

    summary.balance = summary.income - summary.expenses;
    return summary;
  }

  getMonthlySpending() {
    const transactions = this.getTransactions();
    const monthlyData = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        const month = new Date(tx.date).toLocaleString("default", {
          month: "short",
        });
        monthlyData[month] = (monthlyData[month] || 0) + tx.amount;
      }
    });
    return Object.entries(monthlyData).map(([name, spending]) => ({
      name,
      spending,
    }));
  }

  getCategorySpending() {
    const transactions = this.getTransactions();
    const categoryData = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        categoryData[tx.category] =
          (categoryData[tx.category] || 0) + tx.amount;
      }
    });
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
    }));
  }
}

// --- SVG Icons (as React components) ---
const HomeIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const TransactionsIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22v-6" />
    <path d="M12 8V2" />
    <path d="m15 11-3-3-3 3" />
    <path d="m9 13 3 3 3-3" />
  </svg>
);
const GoalsIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const UserIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const SunIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);
const MoonIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const XIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const PlusCircleIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
const ArrowUpRightIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);
const ArrowDownLeftIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 7 7 17" />
    <path d="M17 17H7V7" />
  </svg>
);
const WalletIcon = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14" />
    <path d="M3 5v14" />
  </svg>
);

// --- Custom Hooks ---
const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
};

// --- Main App Component ---
export default function App() {
  // Services are instantiated once and memoized
  const authService = useMemo(() => new AuthService(), []);

  const [page, setPage] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dataService, setDataService] = useState(null);

  // Data states
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);

  // Check for logged-in user on initial load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      handleLoginSuccess(user);
    }
  }, [authService]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const ds = new DataService(user.id);
    setDataService(ds);
    // Load all data for the logged-in user
    setTransactions(ds.getTransactions());
    setGoals(ds.getGoals());
    setSummary(ds.getSummary());
    setMonthlySpending(ds.getMonthlySpending());
    setCategorySpending(ds.getCategorySpending());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setDataService(null);
    setPage("login");
  };

  const reloadData = () => {
    if (dataService) {
      setTransactions(dataService.getTransactions());
      setGoals(dataService.getGoals());
      setSummary(dataService.getSummary());
      setMonthlySpending(dataService.getMonthlySpending());
      setCategorySpending(dataService.getCategorySpending());
    }
  };

  const renderPage = () => {
    if (!isAuthenticated) {
      switch (page) {
        case "login":
          return (
            <LoginPage
              authService={authService}
              onLoginSuccess={handleLoginSuccess}
              onNavigate={setPage}
            />
          );
        case "signup":
          return (
            <SignupPage
              authService={authService}
              onSignupSuccess={handleLoginSuccess}
              onNavigate={setPage}
            />
          );
        default:
          return (
            <LoginPage
              authService={authService}
              onLoginSuccess={handleLoginSuccess}
              onNavigate={setPage}
            />
          );
      }
    }

    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            summary={summary}
            transactions={transactions}
            monthlySpending={monthlySpending}
            categorySpending={categorySpending}
          />
        );
      case "transactions":
        return (
          <TransactionsPage
            transactions={transactions}
            dataService={dataService}
            reloadData={reloadData}
          />
        );
      case "goals":
        return (
          <GoalsPage
            goals={goals}
            dataService={dataService}
            reloadData={reloadData}
          />
        );
      default:
        return (
          <DashboardPage
            summary={summary}
            transactions={transactions}
            monthlySpending={monthlySpending}
            categorySpending={categorySpending}
          />
        );
    }
  };

  if (typeof window === "undefined") return null;

  if (!isAuthenticated) {
    return (
      <div
        className={`min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300`}
      >
        <div className="absolute top-4 right-4">
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </div>
        {renderPage()}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex relative">
        <Sidebar
          user={currentUser}
          page={page}
          setPage={setPage}
          onLogout={handleLogout}
        />
        <MobileSidebar
          user={currentUser}
          page={page}
          setPage={setPage}
          onLogout={handleLogout}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col h-screen">
          <Header
            user={currentUser}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onLogout={handleLogout}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- Layout Components ---
const Sidebar = ({ user, page, setPage, onLogout }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon },
    { id: "transactions", label: "Transactions", icon: TransactionsIcon },
    { id: "goals", label: "Goals", icon: GoalsIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <WalletIcon className="h-8 w-8 text-indigo-500" />
        <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
          FinTrack
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={page === item.id}
            onClick={() => setPage(item.id)}
          />
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <UserIcon className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 p-2 text-gray-600 dark:text-gray-300" />
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full mt-4 text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

const MobileSidebar = ({
  user,
  page,
  setPage,
  onLogout,
  isOpen,
  setIsOpen,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon },
    { id: "transactions", label: "Transactions", icon: TransactionsIcon },
    { id: "goals", label: "Goals", icon: GoalsIcon },
  ];

  const handleNavigate = (pageId) => {
    setPage(pageId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-40 md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <WalletIcon className="h-8 w-8 text-indigo-500" />
            <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
              FinTrack
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 dark:text-gray-400"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={page === item.id}
              onClick={() => handleNavigate(item.id)}
            />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <UserIcon className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 p-2 text-gray-600 dark:text-gray-300" />
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-4 text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ label, icon: Icon, isActive, onClick }) => (
  <a
    href="#"
    onClick={onClick}
    className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </a>
);

const Header = ({
  user,
  isDarkMode,
  setIsDarkMode,
  onLogout,
  onToggleMobileMenu,
}) => (
  <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div className="md:hidden">
      <button
        onClick={onToggleMobileMenu}
        className="text-gray-500 dark:text-gray-400"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </div>
    <div className="hidden md:block">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        Welcome back, {user.name.split(" ")[0]}!
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Here's your financial overview for today.
      </p>
    </div>
    <div className="flex items-center space-x-4">
      <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className="relative md:hidden">
        <UserIcon className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 p-1.5 text-gray-600 dark:text-gray-300" />
      </div>
    </div>
  </header>
);

const ThemeToggle = ({ isDarkMode, setIsDarkMode }) => (
  <button
    onClick={() => setIsDarkMode(!isDarkMode)}
    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
  >
    {isDarkMode ? (
      <SunIcon className="w-5 h-5" />
    ) : (
      <MoonIcon className="w-5 h-5" />
    )}
  </button>
);

// --- Page Components ---

const DashboardPage = ({
  summary,
  transactions,
  monthlySpending,
  categorySpending,
}) => {
  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlySpendingChart data={monthlySpending} />
        </div>
        <div>
          <CategorySpendingChart data={categorySpending} />
        </div>
      </div>
      <div>
        <RecentTransactions transactions={transactions.slice(0, 5)} />
      </div>
    </div>
  );
};

const TransactionsPage = ({ transactions, dataService, reloadData }) => {
  const [showModal, setShowModal] = useState(false);

  const handleAddTransaction = (newTransaction) => {
    dataService.addTransaction(newTransaction);
    reloadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          All Transactions
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add Transaction
        </button>
      </div>
      <TransactionTable transactions={transactions} />
      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddTransaction}
        />
      )}
    </div>
  );
};

const GoalsPage = ({ goals, dataService, reloadData }) => {
  const [showModal, setShowModal] = useState(false);

  const handleAddGoal = (newGoal) => {
    dataService.addGoal(newGoal);
    reloadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Savings Goals
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          Add New Goal
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
      {showModal && (
        <GoalModal onClose={() => setShowModal(false)} onAdd={handleAddGoal} />
      )}
    </div>
  );
};

// --- Dashboard Sub-components ---
const SummaryCards = ({ summary }) => {
  const formatCurrency = (amount) =>
    `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const cards = [
    {
      title: "Current Balance",
      value: formatCurrency(summary.balance),
      icon: WalletIcon,
      color: "text-blue-500",
    },
    {
      title: "Total Income",
      value: formatCurrency(summary.income),
      icon: ArrowUpRightIcon,
      color: "text-green-500",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary.expenses),
      icon: ArrowDownLeftIcon,
      color: "text-red-500",
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {card.value}
              </p>
            </div>
            <div
              className={`p-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${card.color}`}
            >
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MonthlySpendingChart = ({ data }) => (
  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-96">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
      Monthly Spending
    </h3>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <XAxis
          dataKey="name"
          stroke="rgb(156 163 175 / 0.7)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="rgb(156 163 175 / 0.7)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <Tooltip
          cursor={{ fill: "rgba(156, 163, 175, 0.1)" }}
          contentStyle={{
            backgroundColor: "rgba(31, 41, 55, 0.8)",
            borderColor: "rgb(55, 65, 81)",
            color: "#fff",
            borderRadius: "0.5rem",
          }}
        />
        <Bar dataKey="spending" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={8}
        textAnchor="middle"
        fill={fill}
        className="font-bold text-lg dark:fill-white fill-gray-800"
      >
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#999"
        className="dark:fill-gray-400 fill-gray-500"
      >{`$${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
        className="dark:fill-gray-400 fill-gray-500"
      >
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const CategorySpendingChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const COLORS = ["#4f46e5", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-96">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Spending by Category
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const RecentTransactions = ({ transactions }) => {
  const getCategoryStyle = (category) => {
    const styles = {
      Food: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
      Salary:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      Freelance:
        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      Transport:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      Rent: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
      Entertainment:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      Utilities:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    };
    return (
      styles[category] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Recent Transactions
      </h3>
      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-full ${
                  tx.type === "income"
                    ? "bg-green-100 dark:bg-green-900/50"
                    : "bg-red-100 dark:bg-red-900/50"
                }`}
              >
                {tx.type === "income" ? (
                  <ArrowUpRightIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowDownLeftIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-800 dark:text-white">
                  {tx.description}
                </p>
                <p
                  className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${getCategoryStyle(
                    tx.category
                  )}`}
                >
                  {tx.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  tx.type === "income" ? "text-green-500" : "text-red-500"
                }`}
              >
                {tx.type === "income" ? "+" : "-"} ${tx.amount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tx.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Transactions Page Sub-components ---
const TransactionTable = ({ transactions }) => {
  return (
    <div className="bg-white dark:bg-gray-800/50 p-2 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Description
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Category
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Date
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Amount
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20"
              >
                <td className="px-4 py-4 sm:px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {tx.description}
                </td>
                <td className="px-4 py-4 sm:px-6">{tx.category}</td>
                <td className="px-4 py-4 sm:px-6">{tx.date}</td>
                <td
                  className={`px-4 py-4 sm:px-6 font-semibold ${
                    tx.type === "income" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  ${tx.amount.toFixed(2)}
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tx.type === "income"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {tx.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TransactionModal = ({ onClose, onAdd }) => {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ type, description, amount: parseFloat(amount), category, date });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Add Transaction
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 px-4 py-2 rounded-l-md ${
                  type === "expense"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 px-4 py-2 rounded-r-md ${
                  type === "income"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Income
              </button>
            </div>
          </div>
          <FormInput
            id="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <FormInput
            id="amount"
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <FormSelect
            id="category"
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              "Food",
              "Transport",
              "Rent",
              "Entertainment",
              "Utilities",
              "Salary",
              "Freelance",
            ]}
            required
          />
          <FormInput
            id="date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Goals Page Sub-components ---
const GoalCard = ({ goal }) => {
  const progress = (goal.savedAmount / goal.targetAmount) * 100;

  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
      <div>
        <h4 className="font-bold text-lg text-gray-800 dark:text-white">
          {goal.description}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span className="font-semibold text-indigo-500 dark:text-indigo-400">
            ${goal.savedAmount.toLocaleString()}
          </span>{" "}
          saved of ${goal.targetAmount.toLocaleString()}
        </p>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Progress
          </span>
          <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const GoalModal = ({ onClose, onAdd }) => {
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ description, targetAmount: parseFloat(targetAmount) });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
          Add New Goal
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="goal-description"
            label="Goal Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <FormInput
            id="goal-amount"
            label="Target Amount"
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Form Helper Components ---
const FormInput = ({ id, label, ...props }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  </div>
);

const FormSelect = ({ id, label, options, ...props }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
    </label>
    <select
      id={id}
      {...props}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
    >
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

// --- Authentication Pages ---
const LoginPage = ({ authService, onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = authService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 text-indigo-500 mx-auto" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue to FinTrack
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            required
          />
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={() => onNavigate("signup")}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

const SignupPage = ({ authService, onSignupSuccess, onNavigate }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = authService.register(name, email, password);
      onSignupSuccess(user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <WalletIcon className="h-12 w-12 text-indigo-500 mx-auto" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
            Create your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start managing your finances today
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <FormInput
            id="name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            required
          />
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Account
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
