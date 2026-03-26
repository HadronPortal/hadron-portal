import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, ChevronDown, Calendar as CalendarIcon, X, Zap, ArrowRight, BarChart3, TrendingUp, TrendingDown, Clock, Users, Package, ShoppingCart, PanelLeft, PanelLeftClose, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isSameDay, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FilterClientPicker, { type SelectedClient } from './FilterClientPicker';

export interface FilterOption {
  label: string;
  value: string;
}

export interface AdvancedFilterProps {
  onFilter: (filters: {
    startDate: Date;
    endDate: Date;
    search: string;
    status?: string;
    segment?: string;
    repCodes?: number[];
    comparison?: boolean;
    selectedClients?: SelectedClient[];
  }) => void;
  title?: string;
  placeholder?: string;
  className?: string;
  // Dynamic filter options
  statusOptions?: FilterOption[];
  segmentOptions?: FilterOption[];
  representantes?: { rep_codrep: number; rep_nomrep: string }[];
  initialFilters?: any;
  totalRecords?: number;
  hideStatus?: boolean;
  hideSegment?: boolean;
  hideClient?: boolean;
}

const AdvancedFilter = ({ 
  onFilter, 
  placeholder = "Buscar...", 
  className,
  statusOptions = [],
  segmentOptions = [],
  representantes = [],
  initialFilters,
  totalRecords = 0,
  hideStatus = false,
  hideSegment = false,
  hideClient = false,
}: AdvancedFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [startDate, setStartDate] = useState<Date>(initialFilters?.startDate || subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(initialFilters?.endDate || new Date());
  const [comparison, setComparison] = useState(initialFilters?.comparison || false);
  const [activePeriod, setActivePeriod] = useState('30d');
  
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilters?.status || "all");
  const [selectedSegment, setSelectedSegment] = useState<string>(initialFilters?.segment || "all");
  const [selectedReps, setSelectedReps] = useState<number[]>(initialFilters?.repCodes || []);
  const [selectedClients, setSelectedClients] = useState<SelectedClient[]>(initialFilters?.selectedClients || []);

  const [startInput, setStartInput] = useState(format(startDate, 'dd/MM/yyyy'));
  const [endInput, setEndInput] = useState(format(endDate, 'dd/MM/yyyy'));

  const [leftMonth, setLeftMonth] = useState(startDate);
  const [rightMonth, setRightMonth] = useState(endDate);

  useEffect(() => {
    setStartInput(format(startDate, 'dd/MM/yyyy'));
    setLeftMonth(startDate);
  }, [startDate]);

  useEffect(() => {
    setEndInput(format(endDate, 'dd/MM/yyyy'));
    setRightMonth(endDate);
  }, [endDate]);

  // Shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('advanced-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setPeriod = (type: string) => {
    setActivePeriod(type);
    const today = new Date();
    switch (type) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yest = subDays(today, 1);
        setStartDate(yest);
        setEndDate(yest);
        break;
      case '7d':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case '30d':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'month':
        setStartDate(startOfMonth(today));
        setEndDate(today);
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
    }
  };

  const handleDateInputChange = (value: string, isStart: boolean) => {
    // Basic dd/MM/yyyy validation
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number);
      const newDate = new Date(year, month - 1, day);
      if (!isNaN(newDate.getTime())) {
        if (isStart) setStartDate(newDate);
        else setEndDate(newDate);
        setActivePeriod('custom');
      }
    }
  };

  const handleApply = () => {
    onFilter({
      startDate,
      endDate,
      search,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      segment: selectedSegment === 'all' ? undefined : selectedSegment,
      repCodes: selectedReps,
      comparison,
      selectedClients
    });
    setIsOpen(false);
  };

  const clearAll = () => {
    const defaultStart = subDays(new Date(), 30);
    const defaultEnd = new Date();
    setSearch("");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setComparison(false);
    setSelectedStatus("all");
    setSelectedSegment("all");
    setSelectedReps([]);
    setSelectedClients([]);
    setActivePeriod('30d');
    
    // Notify parent to reset data
    onFilter({
      startDate: defaultStart,
      endDate: defaultEnd,
      search: "",
      status: undefined,
      segment: undefined,
      repCodes: [],
      comparison: false,
      selectedClients: []
    });
  };

  const daysDiff = useMemo(() => differenceInDays(endDate, startDate) + 1, [startDate, endDate]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            id="advanced-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-11 pr-14 h-[34px] bg-card border-border border shadow-sm focus-visible:ring-primary/20 rounded-2xl text-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-bold text-muted-foreground opacity-50">
            <span>COMMAND</span>
            <span>K</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-[34px] px-4 gap-2 border shadow-sm rounded-2xl bg-card font-bold transition-all min-w-[140px]",
                  isOpen ? "border-primary text-primary" : "border-border hover:border-primary/50"
                )}
              >
                <Filter size={16} />
                <span className="text-xs">
                  {differenceInDays(endDate, startDate) < 365 ? (
                    `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`
                  ) : (
                    "Filtros"
                  )}
                </span>
                {(selectedStatus !== 'all' || selectedReps.length > 0 || selectedClients.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
                <ChevronDown size={14} className={cn("transition-transform duration-200 ml-1 opacity-50", isOpen && "rotate-180")} />
              </Button>
            </DialogTrigger>
            <DialogContent 
              className={cn(
                "max-w-none p-0 bg-background/95 backdrop-blur-md border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col transition-all",
                isSidebarOpen ? "w-[calc(100vw-2rem)] sm:w-[1360px]" : "w-[calc(100vw-2rem)] sm:w-[1104px]"
              )}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
            >
              <div className="flex flex-col sm:flex-row h-full min-h-[550px] relative">
                {/* Left Sidebar: Quick Periods */}
                {isSidebarOpen && (
                <div className="w-full sm:w-64 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/20 p-5 space-y-6 animate-in slide-in-from-left-4 fade-in duration-300">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 mb-4 px-2">Período</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                      {[
                        { id: 'today', label: 'Hoje' },
                        { id: 'yesterday', label: 'Ontem' },
                        { id: '7d', label: '7 dias' },
                        { id: '30d', label: '30 dias' },
                        { id: 'month', label: 'Este mês' },
                        { id: 'last_month', label: 'Mês passado' },
                        { id: 'custom', label: 'Personalizado' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPeriod(p.id)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activePeriod === p.id 
                              ? "bg-primary text-white shadow-lg shadow-primary/25" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 mb-4 px-2">Opções</h5>
                    <div className="flex items-center justify-between px-2 cursor-pointer" onClick={() => setComparison(!comparison)}>
                        <span className="text-sm font-bold text-foreground/80 whitespace-nowrap">Comparação</span>
                        <div 
                          className={cn(
                            "w-11 h-6 rounded-full relative transition-colors duration-300",
                            comparison ? "bg-primary" : "bg-muted-foreground/40"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                            comparison ? "translate-x-6" : "translate-x-1"
                          )} />
                        </div>
                    </div>
                    <p className="px-2 mt-2 text-[10px] text-muted-foreground">Comparar com período anterior</p>
                  </div>

                  <div className="pt-4 px-2">
                    <Button variant="ghost" className="w-full justify-start px-0 text-muted-foreground hover:text-destructive h-auto py-2 text-xs font-bold gap-2" onClick={clearAll}>
                        <Clock size={14} />
                        Limpar tudo
                    </Button>
                  </div>
                </div>
                )}

                {/* Main Section */}
                <div className="flex-1 flex flex-col bg-card/50">
                  {/* Header Options */}
                  <div className="px-8 pt-6 flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="h-8 px-3 gap-2 text-xs font-bold text-muted-foreground border-border bg-background/50 hover:bg-background hover:text-primary transition-all rounded-xl shadow-sm"
                    >
                      {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                      {isSidebarOpen ? 'Esconder Períodos' : 'Mostrar Períodos'}
                    </Button>
                  </div>

                  <div className="px-8 pb-8 pt-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 flex-1 overflow-y-auto sm:overflow-visible">
                    {/* Filters column */}
                    <div className="space-y-8">
                       <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Busca Rápida</label>
                            <div className="relative group">
                               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                               <Input 
                                 placeholder="Nome, CPF, CNPJ, E-mail..." 
                                 value={search}
                                 onChange={(e) => setSearch(e.target.value)}
                                 className="h-[34px] pl-11 bg-background/50 border-border focus-visible:ring-primary/20 rounded-xl font-medium" 
                               />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Status</label>
                                <select 
                                  value={selectedStatus}
                                  onChange={(e) => setSelectedStatus(e.target.value)}
                                  className="w-full h-[34px] bg-background/50 border border-border rounded-xl px-4 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none truncate"
                                >
                                    <option value="all">Todos os status</option>
                                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Segmento</label>
                                <select 
                                  value={selectedSegment}
                                  onChange={(e) => setSelectedSegment(e.target.value)}
                                  className="w-full h-[34px] bg-background/50 border border-border rounded-xl px-4 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none truncate"
                                >
                                    <option value="all">Todos os segmentos</option>
                                    {segmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                          </div>

                          {!hideClient && (
                            <div className="pt-2">
                              <FilterClientPicker 
                                selectedClients={selectedClients}
                                onChangeClients={setSelectedClients}
                              />
                            </div>
                          )}

                          {representantes.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Representante</label>
                                <select 
                                  multiple
                                  value={selectedReps.map(String)}
                                  onChange={(e) => {
                                      const values = Array.from(e.target.selectedOptions, option => Number(option.value));
                                      setSelectedReps(values);
                                  }}
                                  className="w-full h-24 bg-card border border-border rounded-xl px-2 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent [&>option]:bg-card [&>option]:text-foreground [&>option]:py-1.5 [&>option]:px-2 [&>option]:rounded-md [&>option:checked]:bg-primary/10 [&>option:checked]:text-primary [&>option:checked]:font-bold"
                                >
                                    {representantes.map(rep => (
                                        <option key={rep.rep_codrep} value={rep.rep_codrep}>{rep.rep_codrep} - {rep.rep_nomrep}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground italic px-1">Segure Ctrl ou Command para multiplas escolhas</p>
                            </div>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Data Inicial</label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <Input 
                                  value={startInput}
                                  onChange={(e) => setStartInput(e.target.value)}
                                  onBlur={(e) => handleDateInputChange(e.target.value, true)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleDateInputChange((e.target as HTMLInputElement).value, true)}
                                  className="h-[34px] pl-11 pr-4 bg-background/50 border border-border group-hover:border-primary/50 transition-colors rounded-xl text-sm font-bold tabular-nums"
                                />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest pl-1">Data Final</label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <Input 
                                  value={endInput}
                                  onChange={(e) => setEndInput(e.target.value)}
                                  onBlur={(e) => handleDateInputChange(e.target.value, false)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleDateInputChange((e.target as HTMLInputElement).value, false)}
                                  className="h-[34px] pl-11 pr-4 bg-background/50 border border-border group-hover:border-primary/50 transition-colors rounded-xl text-sm font-bold tabular-nums"
                                />
                            </div>
                          </div>
                       </div>
                                     {/* Global Calendars Side-by-Side */}
                    <div className="flex flex-col gap-4">
                        <div className="hidden sm:grid grid-cols-2 gap-8 bg-muted/10 border border-border/50 rounded-2xl p-6 shadow-inner">
                            <div className="relative flex justify-center border-r border-border/20 pr-4">
                                <Calendar 
                                    mode="range" 
                                    selected={{ from: startDate, to: endDate }} 
                                    month={leftMonth}
                                    onMonthChange={setLeftMonth}
                                    onSelect={(range) => {
                                        if (range?.from) {
                                          setStartDate(range.from);
                                          if (range.to) {
                                            setEndDate(range.to);
                                          } else {
                                            setEndDate(range.from);
                                          }
                                        }
                                        setActivePeriod('custom');
                                    }}
                                    numberOfMonths={1}
                                    locale={ptBR}
                                    className="pointer-events-auto"
                                    classNames={{
                                        months: "flex flex-col",
                                    }}
                                />
                            </div>
                            <div className="relative flex justify-center pl-4">
                                <Calendar 
                                    mode="range" 
                                    selected={{ from: startDate, to: endDate }} 
                                    month={rightMonth}
                                    onMonthChange={setRightMonth}
                                    onSelect={(range) => {
                                        if (range?.from) {
                                          setStartDate(range.from);
                                          if (range.to) {
                                            setEndDate(range.to);
                                          } else {
                                            setEndDate(range.from);
                                          }
                                        }
                                        setActivePeriod('custom');
                                    }}
                                    numberOfMonths={1}
                                    locale={ptBR}
                                    className="pointer-events-auto"
                                    classNames={{
                                        months: "flex flex-col",
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Mobile view calendar */}
                        <div className="sm:hidden bg-muted/10 border border-border/50 rounded-2xl p-4 shadow-inner">
                            <Calendar 
                                mode="range" 
                                selected={{ from: startDate, to: endDate }} 
                                onSelect={(range) => {
                                    if (range?.from) {
                                        setStartDate(range.from);
                                        if (range.to) setEndDate(range.to);
                                        else setEndDate(range.from);
                                    }
                                    setActivePeriod('custom');
                                }}
                                numberOfMonths={1}
                                locale={ptBR}
                                className="pointer-events-auto"
                            />
                        </div>
    </div>
                         <div className="flex items-center gap-3 px-2">
                            <div className="flex-1 h-px bg-border/50" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase py-1">Atalhos sugeridos</span>
                            <div className="flex-1 h-px bg-border/50" />
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase border-border/50" onClick={() => setPeriod('7d')}>Últimos 7 dias</Button>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase border-border/50" onClick={() => setPeriod('30d')}>Últimos 3 meses</Button>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase border-border/50" onClick={() => setPeriod('last_month')}>Este ano</Button>
                         </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="py-4 border-t border-border bg-muted/40 px-8 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
                    <div className="flex items-center gap-8 w-full sm:w-auto py-1 sm:py-0">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CalendarIcon className="text-emerald-500" size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">Período Selecionado</p>
                                <p className="text-[13px] font-black truncate">
                                    {format(startDate, 'dd MMM')} <ArrowRight size={10} className="inline mx-1 text-muted-foreground" /> {format(endDate, 'dd MMM, yyyy')} 
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">{daysDiff} dias</span>
                                </p>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Users className="text-primary" size={20} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest leading-none mb-1">Total Estimado</p>
                                <p className="text-[13px] font-black text-primary">{totalRecords > 0 ? totalRecords.toLocaleString('pt-BR') : '1.248'} <span className="text-[11px] font-bold text-muted-foreground ml-1">registros</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={cn(
                            "hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all animate-in slide-in-from-right-4 border",
                            daysDiff > 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                            {daysDiff > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            <span className="text-xs font-black italic tracking-tight">
                                {daysDiff > 0 ? `+${(daysDiff * 0.4).toFixed(1)}%` : `-${Math.abs(daysDiff * 0.2).toFixed(1)}%`} vs. período anterior
                            </span>
                        </div>
                         <Button 
                            onClick={handleApply} 
                            className="h-[38px] px-6 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 active:scale-95 transition-all w-full sm:w-auto"
                          >
                            <Zap size={16} fill="currentColor" />
                            Aplicar filtros
                         </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="ghost" 
            onClick={clearAll}
            className="h-[34px] px-4 text-muted-foreground hover:text-primary transition-all gap-2 font-bold group"
          >
            <X size={16} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em]">Limpar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilter;
