import React, { useState } from 'react';
import { API_ENDPOINTS, ApiEndpoint } from '../data/apiSpec';
import { Terminal, Copy, Check, Send, Globe, KeyRound, Server } from 'lucide-react';

export default function ApiSpecView() {
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState<number>(3); // Default on POST /api/v1/projects/:projectId/approve for approval flow
  const [copied, setCopied] = useState<boolean>(false);
  const [responsePayload, setResponsePayload] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const endpoint = API_ENDPOINTS[selectedEndpointIdx];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeMockRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setResponsePayload(endpoint.responseBody);
      setIsLoading(false);
    }, 450);
  };

  // Reset custom response when index changes or auto-calc for realism
  React.useEffect(() => {
    setResponsePayload('');
  }, [selectedEndpointIdx]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in" id="api-spec-module">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 font-display">
              Contrato de API RESTful (Portfólio & Upstream)
            </h2>
            <p className="text-xs text-slate-400">
              Endpoints padronizados sustentando o fluxo de aprovação e governança de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400">
          <Server className="w-3.5 h-3.5 text-sky-400" />
          <span>VMO_GATE_URI=https://api.vmo-management.io</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Endpoint selector sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Selecione um Endpoint do Sistema
            </span>
            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
              {API_ENDPOINTS.map((ep, idx) => {
                const isSelected = selectedEndpointIdx === idx;
                const isGet = ep.method === 'GET';
                const isPost = ep.method === 'POST';
                const isPatch = ep.method === 'PATCH';
                const isPut = ep.method === 'PUT';
                
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedEndpointIdx(idx)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-sky-950/40 border-sky-500/40 text-slate-100 shadow-md' 
                        : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        isGet ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        isPost ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        isPatch ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-mono font-semibold text-slate-300 select-all truncate text-[11px]">
                        {ep.path}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                      {ep.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Request-Response playground */}
          <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            
            {/* Action panel header */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                  endpoint.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' :
                  endpoint.method === 'POST' ? 'bg-sky-500/15 text-sky-400' :
                  endpoint.method === 'PATCH' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-blue-500/15 text-blue-400'
                }`}>
                  {endpoint.method}
                </span>
                <span className="font-mono font-semibold text-slate-300">{endpoint.path}</span>
              </div>
              
              <button
                onClick={() => executeMockRequest()}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded text-xs transition-all flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Disparar Requisição
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Left Column: Headers & Body */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                    Headers de Autenticação / Isolamento
                  </h4>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1 leading-normal select-all">
                    {Object.entries(endpoint.headers).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-sky-400 font-medium">{key}:</span> {val}
                      </div>
                    ))}
                  </div>
                </div>

                {endpoint.requestBody ? (
                  <div className="flex-1 flex flex-col mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Request Payload (Body JSON)
                      </h4>
                      <button
                        onClick={() => handleCopy(endpoint.requestBody || '')}
                        className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                      >
                        {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        Copiar Body
                      </button>
                    </div>
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-[10px] text-indigo-200 overflow-auto max-h-[180px]">
                      <pre>{endpoint.requestBody}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800 rounded p-4 text-center mt-3">
                    <span className="text-xs text-slate-500 italic">Este método não exige corpo de requisição.</span>
                  </div>
                )}
              </div>

              {/* Right Column: Server Response Terminal */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Server Side JSON Out
                  </h4>
                  <button
                    onClick={() => handleCopy(responsePayload || endpoint.responseBody)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    Copiar Response
                  </button>
                </div>
                
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 font-mono text-[11px] text-emerald-400 overflow-auto min-h-[220px] max-h-[300px]">
                  {responsePayload ? (
                    <pre>{responsePayload}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center text-xs italic gap-2 py-6">
                      <span>Clique no botão "Disparar Requisição" acima para ver o retorno de servidor simulado.</span>
                      <span className="text-[10px] text-slate-600 not-italic">
                        Esse fluxo garante que dados como pontuações, Canvas e Business Case sejam portados do Upstream para o Downstream na aprovação.
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Explanatory footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-850 px-5 text-slate-400 text-xs flex justify-between items-center">
              <span className="truncate leading-normal">
                <strong>Garantia de Não-Perda:</strong> A rota <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded font-mono">/approve</code> pega os dados de Intake, transiciona status para <code className="text-emerald-300">ACTIVE</code>, e ativa os módulos sem perda histórica.
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
