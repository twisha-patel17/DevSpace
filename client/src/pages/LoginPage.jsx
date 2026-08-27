import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import RightSideDesign from "../components/auth/RightSideDesign";

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.8fr_1fr]">
        
        {/* Left design */}
        <div className="hidden border-r border-[#222225] bg-[#0d0d0f] lg:block">
          <RightSideDesign type="login" />
        </div>

        {/* Right form */}
        <div className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <LoginForm
            onSwitch={() => navigate("/register")}
          />
        </div>

      </div>
    </div>
  );
};

export default LoginPage;