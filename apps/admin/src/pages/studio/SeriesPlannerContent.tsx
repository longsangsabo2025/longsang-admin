/**
 * 🎬 SABO Series Planner
 *
 * AI-powered series production pipeline for short-form video content
 * - Generate series concept with connected storyline
 * - Write scripts for each episode with narrative arc
 * - Track production status
 * - Connect to VEO3.1 for video generation
 *
 * @author LongSang (Elon Mode 🚀)
 */

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Plus,
  Film,
  CheckCircle,
  Clapperboard,
} from 'lucide-react';
import {
  useSeriesPlanner,
  CreateSeriesTab,
  SeriesListView,
  SeriesDetailView,
  ScriptDialog,
  ProductionStudioDialog,
  SystemPromptDialog,
} from './series-planner';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SeriesPlannerContent() {
  const {
    // Navigation
    activeTab, setActiveTab,
    // Data
    seriesList,
    selectedSeries, setSelectedSeries,
    selectedEpisode, setSelectedEpisode,
    // Loading states
    isLoading, isSaving, lastSaved,
    isAutoSaving, autoSaveLastSaved,
    isGenerating, generationStep,
    // Create form
    theme, setTheme,
    location, setLocation,
    character, setCharacter,
    tone, setTone,
    episodeCount, setEpisodeCount,
    // AI Settings
    showAISettings, setShowAISettings,
    aiModel, setAiModel,
    temperature, setTemperature,
    maxTokens, setMaxTokens,
    systemPrompt, setSystemPrompt,
    // Dialogs
    showScriptDialog,
    showProductionStudio, setShowProductionStudio,
    productionEpisode,
    showPromptDialog, setShowPromptDialog,
    isEditingScript, setIsEditingScript,
    editedScript, setEditedScript,
    regeneratingField,
    // Handlers
    handleGenerateSeries,
    handleGenerateScript,
    handleRegenerateArcs,
    handleRegenerateField,
    handleDeleteSeries,
    handleProduceVideo,
    handleBatchGenerate,
    handleSaveScript,
    handleScriptDialogOpenChange,
    handleResetAISettings,
  } = useSeriesPlanner();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
              <Clapperboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Series Planner</h1>
              <p className="text-sm text-muted-foreground">
                AI viết kịch bản series video có mạch truyện xuyên suốt
              </p>
            </div>
          </div>

          {/* Save Status Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang tải...
              </span>
            ) : isSaving ? (
              <span className="flex items-center gap-1 text-yellow-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo mới
            </TabsTrigger>
            <TabsTrigger value="series" className="gap-2">
              <Film className="h-4 w-4" />
              Series của tôi
              {seriesList.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {seriesList.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="create" className="mt-0">
            <CreateSeriesTab
              theme={theme}
              setTheme={setTheme}
              location={location}
              setLocation={setLocation}
              character={character}
              setCharacter={setCharacter}
              tone={tone}
              setTone={setTone}
              episodeCount={episodeCount}
              setEpisodeCount={setEpisodeCount}
              isGenerating={isGenerating}
              generationStep={generationStep}
              onGenerateSeries={handleGenerateSeries}
              showAISettings={showAISettings}
              setShowAISettings={setShowAISettings}
              aiModel={aiModel}
              setAiModel={setAiModel}
              temperature={temperature}
              setTemperature={setTemperature}
              maxTokens={maxTokens}
              setMaxTokens={setMaxTokens}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              onShowPromptDialog={() => setShowPromptDialog(true)}
              onResetAISettings={handleResetAISettings}
            />
          </TabsContent>
          <TabsContent value="series" className="mt-0">
            <div className="p-6 space-y-6">
              {selectedSeries ? (
                <SeriesDetailView
                  selectedSeries={selectedSeries}
                  onBack={() => setSelectedSeries(null)}
                  onDeleteSeries={handleDeleteSeries}
                  onRegenerateArcs={handleRegenerateArcs}
                  onGenerateScript={handleGenerateScript}
                  onProduceVideo={handleProduceVideo}
                  onBatchGenerate={handleBatchGenerate}
                  onSelectEpisode={setSelectedEpisode}
                  onShowScript={() => handleScriptDialogOpenChange(true)}
                  selectedEpisode={selectedEpisode}
                  isGenerating={isGenerating}
                  generationStep={generationStep}
                  isAutoSaving={isAutoSaving}
                  autoSaveLastSaved={autoSaveLastSaved}
                />
              ) : (
                <SeriesListView
                  seriesList={seriesList}
                  onSelectSeries={setSelectedSeries}
                  onCreateNew={() => setActiveTab('create')}
                />
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Script Dialog */}
      <ScriptDialog
        open={showScriptDialog}
        onOpenChange={handleScriptDialogOpenChange}
        selectedEpisode={selectedEpisode}
        isEditingScript={isEditingScript}
        setIsEditingScript={setIsEditingScript}
        editedScript={editedScript}
        setEditedScript={setEditedScript}
        onRegenerateField={handleRegenerateField}
        regeneratingField={regeneratingField}
        onProduceVideo={handleProduceVideo}
        isSaving={isSaving}
        onSaveScript={handleSaveScript}
      />

      {/* Production Studio Dialog */}
      <ProductionStudioDialog
        open={showProductionStudio}
        onOpenChange={setShowProductionStudio}
        productionEpisode={productionEpisode}
        selectedSeries={selectedSeries}
      />

      {/* System Prompt Full View Dialog */}
      <SystemPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
      />
    </div>
  );
}

export default SeriesPlannerContent;
