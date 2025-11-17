import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { login } from '../services/apiService';
import Icon from './common/Icon';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  isSsoEnabled: boolean;
}

const developerPhoto = `data:image/png;base64,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qcftsy/ouW0VcXiVMEfIUR5X6RoxTjBevX6LEiP3hAKfzGUs4tY6uL7uWnCqqsW62wHSs6Qz1h4wWwHkdsV2fIA616y5qKpV23zM5Y80yYqW+YlHlroqKhrlMpvu8gM8j+wFTn3vhrhMpr+8gidc/NhrpUAD1A+Q4d7e3UGR1YI0KqAgyDNDqXlA3zI4q+hAitjUZlO3u+Y6H6qXgE0Wj6oJozGk6K3c3vE8DTR47U//3t859vM4pYJbCIL1Zt1e/QY1F1wzLw4Rk57vWl1/t3+LKSswAorY+Q/d4qK4vJ1d5o3eM2r9K4x3nU9806lHnO777Hk65dI6mXq05886Q0s/4bYj+P+8e+xP8Hl/P86l3vJ9h2kP32vM+/lSgG5i9vO5z+dFz9M96l39KjDnP3lU/4b/93/l/8+I/+CP/xP/1/8B//hX/xL/+F/+J/+T/4V/+D/++H/8f/xX/8H/8H/33/++jH/+C//7f/A//3/+V/jP//v/7f4f/9H/h//43/03/7v/p//5X/+T/2L/+2/4f/+v/6v/87/+Z/+N//H/47/+Z/+D//P/yX/2f/wP//T/+h/4//n/+p/9N/8L/43/6v/5H/+H/+X/5X/4f/4n/83/8f/33/0//7v//7//P/wH//r/8D/6//1//5v/mv/+n/+D//D/6L/zT/47/+l/xT/4//+//zv/zT//D/7P/9v/jf/+3/8X//9v/z//H/+n/0n/1//l/8j//xf/w//xf/w//xf/yv/3//j//9//t/+P//7/+t/8X/8H/zv/77/8L//P/lX/1v//7//d/9n/9z//v/9//5X/xX//r//L/8L//b//D//P//L//l//pf//v/0f//r/5X/6v/+H/+T/+7/yv/93/5X/+P//X/6f/9//wf/x//nf/+X/8P/8X/7X/8X/+b//H//n//D/2D//f//3/wf/4v/xf/6X//H//T//a//x//6/++//p//x//93/0f//n/+T/8l/+3/wv/+P/7b/0n/83/9v/u//5//0v/h//hf//3/4v/n/+j//b/8n//v/mv/5H//j/+X/2n/wv/+f/wf/+H/9v/+H//7/+D/+//9P//r/+v//n/+P/5P/+3//F//rf/Tf/9v//3/6v/3f/8//m//hf/+3/9n/+X/zv/+P/0f//L/8X/+N//P/6P/xf/w//wv/v/+n/8b/+j//7f//X/6v//n/+3//f/+v/9P/9H/63/xf/0//mf/pv/+3/+n/+T/+P//n/9f/pP/1//p//jf//3/wv/9H/+H/4X/9b/yv/63//H/8X//7f/6f/9//n//w//zf/l//yf/+f/+v/lX/+3/8X//b/8X/9//4v/7b/0n/+T/+t//N//b/+H/+H//D/xR/8P//H//a//9//Vf/x//O/+v/9//+P/v//i//F/91//t//p//o//n//y/+D//V//G//q//tf/5//yv/rf/xf/lf/p//vf/n/8n/8L/83/+7/wv/ov/7H//j/+T//tf//H/9v/wv/p//vf/pv/+3/zv/p//l/+d/+z/+N/+r//N/+H/8H/8H/+7//T/9l/8T//9v+L/+n/8n/+3/+X/8D/8n//j/+H/9D/9X/8D//N//T/0X/9H//7/5n/+b/8X/+t//b/+//4f/n/+n//t//V/+b/6P//3/+H/+l//t//lf/y//rf/V/+7//x/+N/+r/8b//T/wv/+n/9D//9/8T//n/8n/8r/+n//9/+H/+//+n//7f+V//6/8P/+H/5f/+f/+f/+X/wv/wv/+H/+t/+j/9V/9b//b/83//r/+l/+d/+j//D/+H/+B//9/+P//r/+1//N//2/+b//b//v/+r/+b/8X//9v//v/+//+n/+9//u/6P/+n/+//8f//H/8L/+x//4f/7b/+D/+9//P/5D//7/+N/+r/7X/2H/wv/8H/+//8f/+H/+B/6L/wH/+H//N//5/yT/w3/+N//pf/m//9/+7/wv//f/o/8n/+j/+//83/+//4//lf/o/+7//N//r/+D/wv/gP//n/+L/+H/9v/w//o/+r/+b/+L/9X/+H//X/9v/9P/+j/+f/zf/y//vf/r/+z//d/8H/0X/+t/8X/8H/8H/1/+v/8n/+H/zX/0n/+P/9D//P/5f/+f/l//p//wf//f/l//v//V/+b/6P/9P//f/+n//7f+V//Lf/xf/+f/8f/+7//D/+v//L/9r//t//l//x//wv/rv/9n/97/+3/xf/+H/+t/9D/9b/+D/+b/6X/wv/+b/8H/yP/zf/+v//f/+v/tf/w//xf/n//l/+j/9//r/+//+P/8n/8H/87/+L//l/+j//x/9D//X//B/+L/7r/+b/6//xf//f/jf/4P/v//9//+b//V//6/z78f/63/7P/9H//b/8r/+3//X/8X/4P//P//X/8D/4v/w//wf/+v/+D/8f/wf/pf/N/+7/+P//H/+//+//9b//X/9X//D//d//9f/p//6f/yv/xf/2//ov/8H/+H/8n/+r/+N/9P//V/9T//V/+V/9X//X/9n/8b/+j/8X//l/+r/+V/+n//x//6/99//R/+X/8D/8L/9V/+9f/3f/8P//H/+B/+b/+d/+v//X/9D//t/+P/+n/87/4P/6//8//8P//7/8L/7v/p//W//b/8X/+j//N//h//xf/h/9//l/+F//rf/n/8n/8n//n/+7/+P/zX/wH/+L/83//L//rf+D//T//D/+D//7/+b/8X/wv/ov/yv/63/wv/+L/+D/9H/9X//l/+n/wv/0//hf/+n/+//6f/+X/yv//n/wP/8L/+z/+T/+H/+N//6//xv/4f/ov/+H/4b//V//D/9f/9X/+P//t/9X/+P/8v/yf/zf/1f/53/+T/2v/8v/9P/pP/q//X/+z/+j/8H/wP//n/9f/o/+l//h//5f/6v/8H//P//V/+n//j/9P/+r/9D//d//9//u//3f+D//5/+H//n/5v/+P/4v/pv/5n/8X/8L/8P//v/0P/8H/8n/6b/9X/9H//T//n/6H/2//6P/o//o//nf/+3/5X/9H/+D//p//wf/+H//f/+n/+b/+t//rf//v/g//x//6v/+r//j/+//+L/9H/+3/wH/8H/8P//N/+3/4b/+n//d/9D//p/+L/+9/9D/+T//l/+t/+V/9L//r/9f/pf/+v//H/9v/wP/ov/qv//H/4v/pP/1//4v//7f+X/+L/+b/2n//D/+V/9V//7/+b//D/+n/+b/+//6v/+X/+N/+T//jf/wf/+D//nf+n//v/2v/8H/8v/lf//H/wv/jf/q//pv/rf//f/+n/9r/+b/+b//d/+T//l/+7/+//9//a/8X//P/jf//X/7P/83/9v/wP/4f/9n/9f/xv/yf/5f/rf/zv/+n/9T/+t//N//D//l//1//hf/N/+D//b/+z/97/8r//n/+t/+n//rf//f/xf/+f/8f//X/6f/9H/9b/8X/4v/rf/nf/+P//P//P//X/8X/zf//v//V/+r/+t/73/4v/8L/5f/v/+T//z/+T/+//wf/p//hf//H//zf/pP/o/+l//1//rf+V/8b//f/i//l/8H//f/+D/8f//p//rf+T/+7/+b/+n//7f/6f/yv/o/+7//tf/xv/p/+j/8n//X/+D/+b/+j/8f/wf/6X/p//2v/4H//p//jf//3//l/+H//J/+z/wv/+v/6v//P/4v/yf/y/+N/+7/+1/+n/+//4f/n//x/+b/6//xv/5H/0X/+L/+j/8H/6P/zv/+r/+b/8n//X/+b/0f/v//l//o/+9//b/7v/+v//b/+P//V//h//xv/p//O/+r/9n//p//hf/j//X//3f/9//w//2v/qP/l//x//d//7//l//1//o//yf/+7//V/+7/+b//z//r/+X/+H//D/87/+1/+n/+9/+7//N//q/+L/9D//j/+1/+9/+//8f//n/+v/9f/+H/yv/9b/+9/+9/+N/+L/+X/+L/+H/xv/0X/9L/8X/yv/4v/4f/4P//X/6f/+H//t/+n/+P/6X/zX/0H/8n/+H/+v/0P/8v/jf/+P//v//H/+B//9/+P/+X/+D//X//H//D/+P/yP/2P/5H/0X/0P/+7//T/+b/2f/+n/5b/4P/p//yf//v/tf//X/+X/xf/lf/53/8n/7f/xf//f/2//6P/+j//h/+h//9/9T//f/zX//v/+L/8n/8n/2//1f/p//wf//f/p//0f/x//O/+X//N/+j/+L/9f/4v/rv/8P//H/+T//n//y//9/+X/+X/+t/+1//5//2/+a//v//X//n/9r/+9//n/+P/5P/+D/+d/9r/+j//X/9n/+H//b/8H/+z//rf/6X/+D//P/9n/+9//p//N//S//xv//f/pP/ov/+3//f/9v/6f/l//v//t//9/yH//N//5//2v/w//wP/yP/zX/8v/zP/+v/tP/5X/+3/8X/+X/+n//x//S/+V/+r//x//a//D/+H/6L/5P/8n/9n//p//x//w//8v/gf//H/2f/+H/5f/jf/4P/u/+V/+N/+z//T//H/9T//L//n/5f/h//x/+b//f/+P//B//9/+D//n/9f/+n//N/+H/+L/+j/9n//9/9L/+P/+D//H/8L/+n//D/+l/+1//J/+//+T//6/x9+F/+l/+b//l//yv/p//2//0/+B//y//S//wv/+f/ov/+n/+j/8L/+V/+1/+D/+H//v/y//ov/6v/8H//rf/3f/1v/wv//b/4f/ov/xf//X/7P/9f//7/5P/+X/+n/+V/8b/6f/+H/+r//rf+n//v/+l//Vf/x//6P/+v/+t//V//D//V//X//x//N//x//N//V//o//pf/jf/N/+7/+1/+X/8D//N//hf+v/wP/8v/+v/9P/+j/8v/9P/wv/pf//v/0f//P/4v/5f/+f/+P/9f/+b/8n/+3/8H/+n/3//p/+X/8H/+9//O//h//O/+/f+N//h/9H/+//8f//n/7b/+v//x/8L/+x//yf/5f/ov/8n/yP/yv//n/+P/8n/8n//rf/N/+L//x/+7/+D/+P/yP/+9//n/9f/+L/+P/+n/+7/8v/9P/lf//v/9P/+t/+L/+r/+//tf/5P/q//X/+P//l//nf//H/8X/4P/0f/5//l/+d/6D/+n//d//qP/+X//h/+T/+N/8n/+j/+//+//8H/+r/+t/+V/+H//7/+D/9D/9P/9f/yf/5P/y//rv/8X/8H/6H/2//+//p//nf//v/0X/+t/+9f/3f/rf/J/+P/+j/8P//v/0v/8f/+P//X/93/+7/83/8P//v//v/+T/+j/+P/+j/9H/+D//H/8n/+X/+f//3/+X/+f/9v/w//9/+n/+//8f/4v/+n//b/8H/1X/+d//6//5f/gf+L/+v/rv/+P/+D/+P/8D/+D//3//d/+X/2n/9D//l/+7//2//hf/rf/pf+7/+V/+H//p//v//p//1//V/w3/8H/8H/+V//l/+H/8H/8v/6n/2v/8n//p/+t/+//l//m/+t/+j/wv/rf//f/hf/x/+D/+N/+V//jf+x/9v//n/+V/+//rf/0//p//nf/h/+V/+D//r/9v/+H/+l/+D//b/+7/+j/8H/9P/zf/1f/ov//H/9X/+f/zP/9X/0n/+T/wf/rv/5P/+H//x/8n/6f//f/y//2f/v//V//O/8L//tf/w//xf/N//2/+H//l//p/+X/+j/8r//J/9r/+b/+L/+T/6v/5H/+D/+j//p//h//h//rf+n/+H/0P/+n/+D//L/+9/8X/4v/v//V/+H//lf/2P/4v/8H//P/+H//v//h//pf/6v/+H/+P/6X/x/+n//n/+//+n//D//w/9V/8D/+f//X/6P//t/+t/73/4v/4f/zf/wf/6//g//l/+D/+n//2//jf/8//rf/w//q//nf+j/8D//zf+t/+T//2//xv/v/+V//xf/tf/tf/w//6H/6v//P/+n/+//8v/vP/5P/+n/+n/+X/zv/+t/+j/+b/wv//b/+X/+n/+t//b/+L/9P/+T/+//wf//f/tf+L//X//3/8f/+D//2/+D/6L/zT//D/9f/w//zP/y/+T/+X/+l/+j/wv//P/jf//X/7P/9H/8n/yP/wf/xv/v//w//jf//H//T//a//wv/yf/Nf/q/+x/+j/+H/8P//N/+1//B//j//v//xf/5//N//X/+//8f/z//jf/5P/l//jf/m//gP//v/pP/tP/5X/+n//r/+D/9D//9/+N/+L/+7//1//xf//v/p//v//p/+T//S/+H//N//l/+t/+n/87/4v/9//5f/ov/xf/i/+r/wv/5n/5f/+t/+d/+t//1/9D/wH//t/+//+r/+D//N//j/+D/8f//p//y//a//pv/+j/+r/8H/8H/+L/+j/+//83/+f/yv/+X/wv/8//qf/jf/rf+l//g//S/wv/9v/rf/yP/yf/rv/+b/+n//rf/9P/9f/+r/+T/+j/8b/+j//O//V//b//q//jf/8P/+9/9D/+b//b//v//v/+j/+7/+1/+X/5n/+X/+f//7//N//q/+D//H//7/+n/+L//T//1f/zP/+n/+//wP//f/+3/+//wH/+D//6/wA==`;

const Login: React.FC<LoginProps> = ({ onLoginSuccess, isSsoEnabled }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const user = await login({ username, password });
      onLoginSuccess(user);
    } catch (err: any) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Não foi possível conectar ao servidor. Verifique se a API está em execução.');
      } else {
        setError(err.message || 'Usuário ou senha inválidos.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSsoLogin = () => {
    // Redirect to the backend which will construct the SAML request and redirect to the IdP
    window.location.href = `http://${window.location.hostname}:3001/api/sso/login`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg p-4">
      <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="text-center mb-8">
            <Icon name="ShieldCheck" size={48} className="mx-auto text-brand-primary mb-2" />
          <h1 className="text-3xl font-bold text-brand-dark dark:text-dark-text-primary">Inventário Pro</h1>
          <p className="text-gray-500 dark:text-dark-text-secondary mt-1">Faça login para continuar</p>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-dark-text-secondary text-sm font-bold mb-2" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              data-testid="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border dark:border-dark-border rounded w-full py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: admin"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-dark-text-secondary text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border dark:border-dark-border rounded w-full py-2 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="********"
            />
          </div>
          <div className="flex flex-col items-center justify-between gap-4">
            <button
              type="submit"
              data-testid="login-button"
              disabled={isLoading}
              className="bg-brand-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            {isSsoEnabled && (
                <>
                    <div className="relative w-full my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-dark-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-dark-card text-gray-500 dark:text-dark-text-secondary">ou</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSsoLogin}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-dark-text-primary font-semibold py-2 px-4 border border-gray-300 dark:border-dark-border rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 w-full flex items-center justify-center gap-2"
                    >
                        <Icon name="KeyRound" size={18}/> Entrar com SSO
                    </button>
                </>
            )}
          </div>
        </form>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 text-xs">
        <img
          src={developerPhoto}
          alt="Foto do Desenvolvedor"
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 dark:border-dark-border"
        />
        <div className="text-left text-gray-500 dark:text-dark-text-secondary">
          <p className="font-semibold">MRR INFORMATICA</p>
          <p className="text-gray-400 dark:text-gray-500">&copy; 2025 Dev: Marcelo Reis</p>
        </div>
      </div>
    </div>
  );
};

export default Login;