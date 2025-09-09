 // Estrutura de dados
        let appData = {
            settings: {
                summonerName: '',
                currentRank: '',
                currentDivision: 'IV',
                currentLP: 0,
                desiredRank: '',
                desiredDays: 10,
                dreamRank: '',
                dailyGamesTarget: 5
            },
            dailyRecords: [],
            notes: '',
            motivationMessage: '"A cada partida, você está mais próximo do seu objetivo!"'
        };

        // Mapeamento de ranks para valores numéricos
        const rankValues = {
            'Iron': 1,
            'Bronze': 2,
            'Silver': 3,
            'Gold': 4,
            'Platinum': 5,
            'Emerald': 6,
            'Diamond': 7,
            'Master': 8,
            'Grandmaster': 9,
            'Challenger': 10
        };

        const divisionValues = {
            'IV': 1,
            'III': 2,
            'II': 3,
            'I': 4
        };

        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            updateUI();
            setToday();
            drawChart();
        });

        function setToday() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('recordDate').value = today;
        }

        // Salvar configurações
        function saveSettings() {
            appData.settings = {
                summonerName: document.getElementById('summonerName').value,
                currentRank: document.getElementById('currentRank').value,
                currentDivision: document.getElementById('currentDivision').value,
                currentLP: parseInt(document.getElementById('currentLP').value) || 0,
                desiredRank: document.getElementById('desiredRank').value,
                desiredDays: parseInt(document.getElementById('desiredDays').value) || 10,
                dreamRank: document.getElementById('dreamRank').value,
                dailyGamesTarget: parseInt(document.getElementById('dailyGamesTarget').value) || 5
            };
            saveData();
            updateUI();
            alert('✅ Configurações salvas com sucesso!');
        }

        // Adicionar registro diário
        function addDailyRecord() {
            const date = document.getElementById('recordDate').value;
            const gamesPlayed = parseInt(document.getElementById('gamesPlayed').value) || 0;
            const wins = parseInt(document.getElementById('wins').value) || 0;
            const losses = parseInt(document.getElementById('losses').value) || 0;
            
            if (!date) {
                alert('❌ Por favor, selecione uma data!');
                return;
            }

            if (gamesPlayed !== wins + losses) {
                alert('⚠️ O número de partidas não corresponde ao total de vitórias + derrotas!');
                return;
            }

            const record = {
                date: date,
                gamesPlayed: gamesPlayed,
                wins: wins,
                losses: losses,
                lpChange: parseInt(document.getElementById('lpChange').value) || 0,
                endDayRank: document.getElementById('endDayRank').value || appData.settings.currentRank,
                endDayDivision: document.getElementById('endDayDivision').value,
                endDayLP: parseInt(document.getElementById('endDayLP').value) || 0,
                timestamp: new Date().toISOString()
            };

            appData.dailyRecords.push(record);
            
            // Atualizar elo atual com o final do dia
            if (record.endDayRank) {
                appData.settings.currentRank = record.endDayRank;
                appData.settings.currentDivision = record.endDayDivision;
                appData.settings.currentLP = record.endDayLP;
            }

            saveData();
            updateUI();
            drawChart();
            clearDailyForm();
            alert('✅ Registro adicionado com sucesso!');
        }

        function clearDailyForm() {
            document.getElementById('gamesPlayed').value = 0;
            document.getElementById('wins').value = 0;
            document.getElementById('losses').value = 0;
            document.getElementById('lpChange').value = 0;
            document.getElementById('endDayRank').value = '';
            document.getElementById('endDayDivision').value = 'IV';
            document.getElementById('endDayLP').value = 0;
            setToday();
        }

        // Salvar notas
        function saveNotes() {
            appData.notes = document.getElementById('notes').value;
            appData.motivationMessage = document.getElementById('motivationMessage').value || appData.motivationMessage;
            saveData();
            updateUI();
            alert('✅ Notas salvas com sucesso!');
        }

        // Calcular LP total necessário
        function calculateTotalLP(fromRank, fromDiv, fromLP, toRank, toDiv = 'I', toLP = 100) {
            if (!fromRank || !toRank) return 0;
            
            const fromValue = rankValues[fromRank];
            const toValue = rankValues[toRank];
            const fromDivValue = divisionValues[fromDiv];
            const toDivValue = divisionValues[toDiv];
            
            let totalLP = 0;
            
            // LP para completar divisão atual
            totalLP += (100 - fromLP);
            
            // LP para subir divisões no mesmo elo
            if (fromRank === toRank) {
                totalLP += (toDivValue - fromDivValue - 1) * 100;
                totalLP += toLP;
            } else {
                // LP para completar o elo atual
                totalLP += (4 - fromDivValue) * 100;
                
                // LP para elos intermediários (400 LP por elo)
                totalLP += Math.max(0, (toValue - fromValue - 1) * 400);
                
                // LP para o elo de destino
                totalLP += (toDivValue - 1) * 100 + toLP;
            }
            
            return Math.max(0, totalLP);
        }

        // Atualizar UI
        function updateUI() {
            // Carregar configurações
            document.getElementById('summonerName').value = appData.settings.summonerName || '';
            document.getElementById('currentRank').value = appData.settings.currentRank || '';
            document.getElementById('currentDivision').value = appData.settings.currentDivision || 'IV';
            document.getElementById('currentLP').value = appData.settings.currentLP || 0;
            document.getElementById('desiredRank').value = appData.settings.desiredRank || '';
            document.getElementById('desiredDays').value = appData.settings.desiredDays || 10;
            document.getElementById('dreamRank').value = appData.settings.dreamRank || '';
            document.getElementById('dailyGamesTarget').value = appData.settings.dailyGamesTarget || 5;
            
            // Carregar notas
            document.getElementById('notes').value = appData.notes || '';
            document.getElementById('motivationMessage').value = appData.motivationMessage || '';
            document.getElementById('motivationDisplay').textContent = appData.motivationMessage || '"A cada partida, você está mais próximo do seu objetivo!"';
            
            // Calcular estatísticas
            updateStatistics();
            
            // Atualizar histórico
            updateHistory();
        }

        function updateStatistics() {
            const records = appData.dailyRecords;
            
            // Total de partidas
            const totalGames = records.reduce((sum, r) => sum + r.gamesPlayed, 0);
            const totalWins = records.reduce((sum, r) => sum + r.wins, 0);
            const totalLosses = records.reduce((sum, r) => sum + r.losses, 0);
            const totalLP = records.reduce((sum, r) => sum + r.lpChange, 0);
            
            // Taxa de vitória
            const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : 0;
            
            // Média de LP por partida
            const avgLP = totalGames > 0 ? (totalLP / totalGames).toFixed(1) : 0;
            
            // LP necessário para metas
            const desiredLP = calculateTotalLP(
                appData.settings.currentRank,
                appData.settings.currentDivision,
                appData.settings.currentLP,
                appData.settings.desiredRank
            );
            
            const dreamLP = calculateTotalLP(
                appData.settings.currentRank,
                appData.settings.currentDivision,
                appData.settings.currentLP,
                appData.settings.dreamRank
            );
            
            // Progresso
            const startLP = calculateTotalLP(
                records[0]?.endDayRank || appData.settings.currentRank,
                records[0]?.endDayDivision || appData.settings.currentDivision,
                records[0]?.endDayLP || appData.settings.currentLP,
                appData.settings.currentRank,
                appData.settings.currentDivision,
                appData.settings.currentLP
            );
            
            const desiredProgress = desiredLP > 0 ? Math.min(100, (totalLP / desiredLP) * 100) : 0;
            const dreamProgress = dreamLP > 0 ? Math.min(100, (totalLP / dreamLP) * 100) : 0;
            
            // Estimativa de dias
            const daysToDesired = avgLP > 0 ? Math.ceil(desiredLP / (avgLP * appData.settings.dailyGamesTarget)) : '-';
            
            // Atualizar elementos
            document.getElementById('totalGames').textContent = totalGames;
            document.getElementById('winRate').textContent = winRate + '%';
            document.getElementById('avgLP').textContent = avgLP;
            document.getElementById('daysToDesired').textContent = daysToDesired;
            
            document.getElementById('desiredProgress').style.width = desiredProgress + '%';
            document.getElementById('desiredProgress').textContent = desiredProgress.toFixed(1) + '%';
            document.getElementById('desiredLP').textContent = `Faltam ${desiredLP} LP`;
            
            document.getElementById('dreamProgress').style.width = dreamProgress + '%';
            document.getElementById('dreamProgress').textContent = dreamProgress.toFixed(1) + '%';
            document.getElementById('dreamLP').textContent = `Faltam ${dreamLP} LP`;
        }

        function updateHistory() {
            const historyList = document.getElementById('historyList');
            const recentRecords = appData.dailyRecords.slice(-10).reverse();
            
            historyList.innerHTML = recentRecords.map(record => `
                <div class="history-item">
                    <span>${new Date(record.date).toLocaleDateString('pt-BR')}</span>
                    <span>
                        <span class="win">V: ${record.wins}</span> | 
                        <span class="loss">D: ${record.losses}</span> | 
                        LP: ${record.lpChange > 0 ? '+' : ''}${record.lpChange}
                    </span>
                </div>
            `).join('');
        }

        // Gráfico
        function drawChart() {
            const canvas = document.getElementById('evolutionChart');
            const ctx = canvas.getContext('2d');
            
            // Limpar canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (appData.dailyRecords.length === 0) {
                ctx.fillStyle = '#cdbe91';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Sem dados para exibir', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Preparar dados
            const records = appData.dailyRecords.slice(-30); // Últimos 30 registros
            const lpHistory = [];
            let cumulativeLP = 0;
            
            records.forEach(record => {
                cumulativeLP += record.lpChange;
                lpHistory.push(cumulativeLP);
            });
            
            // Configurar canvas
            const padding = 40;
            const graphWidth = canvas.width - padding * 2;
            const graphHeight = canvas.height - padding * 2;
            
            // Encontrar valores máximo e mínimo
            const maxLP = Math.max(...lpHistory, 10);
            const minLP = Math.min(...lpHistory, -10);
            const range = maxLP - minLP;
            
            // Desenhar eixos
            ctx.strokeStyle = '#3c4043';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.stroke();
            
            // Desenhar linha zero
            const zeroY = canvas.height - padding - ((0 - minLP) / range) * graphHeight;
            ctx.strokeStyle = '#5c5c5c';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding, zeroY);
            ctx.lineTo(canvas.width - padding, zeroY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Desenhar gráfico
            if (lpHistory.length > 1) {
                ctx.strokeStyle = '#c89b3c';
                ctx.lineWidth = 5;
                ctx.beginPath();
                
                lpHistory.forEach((lp, index) => {
                    const x = padding + (index / (lpHistory.length - 1)) * graphWidth;
                    const y = canvas.height - padding - ((lp - minLP) / range) * graphHeight;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    // Desenhar pontos
                    ctx.fillStyle = lp >= 0 ? '#4caf50' : '#f44336';
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                ctx.stroke();
            }
            
            // Labels
            ctx.fillStyle = '#cdbe91';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Evolução de LP', canvas.width / 2, 20);
        }

        // Persistência de dados
        function saveData() {
            try {
                localStorage.setItem('lolEloTracker', JSON.stringify(appData));
                console.log('Dados salvos com sucesso!');
            } catch (e) {
                console.error('Erro ao salvar dados:', e);
                alert('⚠️ Erro ao salvar dados no navegador. Considere exportar seus dados.');
            }
        }

        function loadData() {
            try {
                const saved = localStorage.getItem('lolEloTracker');
                if (saved) {
                    appData = JSON.parse(saved);
                    console.log('Dados carregados com sucesso!');
                }
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
            }
        }

        // Exportar dados
        function exportData() {
            const dataStr = JSON.stringify(appData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lol-elo-tracker-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            alert('✅ Dados exportados com sucesso!');
        }

        // Importar dados
        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const imported = JSON.parse(e.target.result);
                    
                    // Validar estrutura básica
                    if (imported.settings && imported.dailyRecords) {
                        if (confirm('⚠️ Isso substituirá todos os dados atuais. Deseja continuar?')) {
                            appData = imported;
                            saveData();
                            updateUI();
                            drawChart();
                            alert('✅ Dados importados com sucesso!');
                        }
                    } else {
                        alert('❌ Arquivo inválido!');
                    }
                } catch (error) {
                    alert('❌ Erro ao importar arquivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        }

        // Limpar histórico
        function clearHistory() {
            if (confirm('⚠️ Isso apagará todo o histórico de partidas. Deseja continuar?')) {
                appData.dailyRecords = [];
                saveData();
                updateUI();
                drawChart();
                alert('✅ Histórico limpo!');
            }
        }

        // Auto-save a cada 30 segundos
        setInterval(saveData, 30000);

        // Salvar ao fechar a página
        window.addEventListener('beforeunload', saveData);