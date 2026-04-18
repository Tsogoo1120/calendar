<template>
  <div class="bg-warm-50 text-warm-800 min-h-screen" v-cloak>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-warm-600 text-xl font-serif animate-pulse">Уншиж байна...</div>
    </div>

    <div v-else class="max-w-7xl mx-auto px-4 py-10">

      <!-- HEADER -->
      <header class="mb-10 pb-6 border-b-2 border-warm-200">
        <div class="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 class="font-serif text-5xl font-bold tracking-tight text-warm-800">📅 Хамтын Ажлын Календар</h1>
            <p class="text-warm-600 text-lg mt-1 font-light">Марлаа ба Цогоо</p>
          </div>
          <div class="flex gap-2 items-center flex-wrap">
            <span class="text-xs bg-warm-100 text-warm-600 px-3 py-1 rounded-full border border-warm-200">Drag &amp; Drop идэвхтэй</span>
            <span class="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
              Өнөөдөр: {{ formatDisplay(today) }} — {{ MN_DAYS[today.getDay()] }}
            </span>
          </div>
        </div>

        <!-- Week navigation -->
        <div class="flex items-center gap-3 flex-wrap">
          <button @click="prevWeek"
            class="flex items-center gap-1 text-sm border border-warm-200 bg-white text-warm-600 px-4 py-2 rounded-lg hover:bg-warm-100 transition-all">
            ← Өмнөх
          </button>
          <span class="font-semibold text-warm-800 text-sm min-w-[180px] text-center">
            {{ weekRangeLabel }}
          </span>
          <button @click="nextWeek"
            class="flex items-center gap-1 text-sm border border-warm-200 bg-white text-warm-600 px-4 py-2 rounded-lg hover:bg-warm-100 transition-all">
            Дараа →
          </button>
          <button v-if="!isCurrentWeek" @click="goToToday"
            class="text-sm bg-shared text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-all shadow">
            Өнөөдөр
          </button>
        </div>
      </header>

      <!-- AI SCHEDULER -->
      <section class="mb-8">
        <div class="border-2 rounded-2xl shadow-sm transition-all"
          :class="aiPanel ? 'bg-gradient-to-br from-violet-50 to-white border-violet-200' : 'bg-white border-warm-200'">
          <div class="flex items-center gap-3 px-6 py-4 cursor-pointer select-none" @click="aiPanel = !aiPanel">
            <span class="text-2xl">✨</span>
            <h2 class="font-serif text-2xl font-bold text-violet-700">AI Автомат Хуваарь</h2>
            <span class="text-xs text-violet-400 bg-violet-100 px-2 py-0.5 rounded-full">Claude</span>
            <span class="ml-auto text-warm-400 text-sm">{{ aiPanel ? '▲' : '▼' }}</span>
          </div>

          <div v-if="aiPanel" class="px-6 pb-6 space-y-4">
            <!-- API key -->
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Anthropic API Key</label>
              <input v-model="aiApiKey" type="password" placeholder="sk-ant-..."
                @input="saveApiKey"
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>

            <!-- Prompt -->
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Даалгавраа бичнэ үү</label>
              <textarea v-model="aiPrompt"
                placeholder="жнь: 4-р сарын 22-ны лекцийн бэлтгэлд 2 цаг хэрэгтэй, өдрийн цагаар. Мөн подкаст засварлах 1.5 цагийг энэ долоо хоногт хийх..."
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" rows="3"
                @keydown.ctrl.enter="scheduleWithAI"></textarea>
              <div class="text-xs text-warm-400 mt-1">Ctrl+Enter дарж илгээх</div>
            </div>

            <button @click="scheduleWithAI"
              :disabled="aiLoading || !aiPrompt.trim() || !aiApiKey.trim()"
              class="text-sm bg-violet-600 text-white px-6 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
              <span v-if="aiLoading" class="animate-pulse">⏳ Боловсруулж байна...</span>
              <span v-else>✨ Автоматаар хуваарилах</span>
            </button>

            <!-- Error -->
            <div v-if="aiError" class="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              ⚠️ {{ aiError }}
            </div>

            <!-- Proposed events preview -->
            <div v-if="aiProposed.length > 0" class="mt-2">
              <div class="font-semibold text-sm text-warm-700 mb-3">📋 Санал болгох хуваарь — шалгаад нэмнэ үү:</div>
              <div class="space-y-2 mb-4">
                <div v-for="(evt, i) in aiProposed" :key="i"
                  class="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-start justify-between group">
                  <div>
                    <div class="text-xs font-semibold text-violet-600 mb-0.5">{{ evt.date }} &nbsp;{{ evt.time }}</div>
                    <div class="text-sm font-medium text-warm-800">{{ evt.title }}</div>
                    <div v-if="evt.details" class="text-xs text-warm-500 mt-0.5">{{ evt.details }}</div>
                  </div>
                  <button @click="aiProposed.splice(i, 1)"
                    class="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 text-xl leading-none ml-4 transition-all">×</button>
                </div>
              </div>
              <div class="flex gap-3">
                <button @click="applyProposed"
                  class="text-sm bg-violet-600 text-white px-5 py-2 rounded-xl hover:bg-violet-700 transition-all">
                  ✅ Календарт нэмэх
                </button>
                <button @click="aiProposed = []"
                  class="text-sm border border-warm-200 text-warm-600 px-5 py-2 rounded-xl hover:bg-warm-50 transition-all">
                  Цуцлах
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- WEEKLY SCHEDULE -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">📆</span>
          <h2 class="font-serif text-3xl font-semibold">Долоо хоногийн хуваарь</h2>
        </div>

        <div class="grid gap-3">
          <div v-for="day in weekDays" :key="dateKey(day)"
            class="bg-white border border-warm-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            :class="{
              'drag-over': dragOverDay === dateKey(day),
              'ring-2 ring-shared/40 border-shared/40': isToday(day),
            }"
            @dragover.prevent="dragOverDay = dateKey(day)"
            @dragleave="dragOverDay = null"
            @drop="dropEvent(dateKey(day))">

            <!-- Day header -->
            <div class="flex items-center justify-between px-6 pt-4 pb-3 border-b border-warm-100">
              <div class="flex items-center gap-3">
                <div class="text-center">
                  <div class="text-xs font-semibold text-warm-600 uppercase tracking-wide leading-none mb-0.5">
                    {{ MN_DAYS[day.getDay()] }}
                  </div>
                  <div class="font-bold text-lg leading-none"
                    :class="isToday(day) ? 'text-shared' : 'text-warm-800'">
                    {{ day.getDate() }}
                  </div>
                </div>
                <div v-if="isToday(day)"
                  class="text-xs bg-shared text-white px-2 py-0.5 rounded-full font-semibold">
                  Өнөөдөр
                </div>
                <div v-if="isPast(day) && !isToday(day)"
                  class="text-xs text-warm-300 font-medium">
                  Өнгөрсөн
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="openAddEvent(dateKey(day))"
                  class="text-xs bg-warm-100 hover:bg-warm-200 text-warm-600 px-3 py-1.5 rounded-lg transition-all">
                  + Үйл явдал
                </button>
                <button @click="deleteDay(dateKey(day))"
                  class="text-xs bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all"
                  title="Өдрийг устгах">
                  🗑
                </button>
              </div>
            </div>

            <!-- Events -->
            <div class="px-6 py-4 space-y-2">
              <transition-group name="fade">
                <div v-for="(event, ei) in eventsForDay(dateKey(day))" :key="event.id"
                  class="flex items-start gap-4 pl-4 border-l-4 py-2 group cursor-grab active:cursor-grabbing rounded-r-lg transition-all"
                  :class="[
                    isToday(day) ? 'border-shared/60 hover:bg-shared/5' : 'border-warm-200 hover:bg-warm-50',
                    draggingEvent && draggingEvent.dateKey === dateKey(day) && draggingEvent.ei === ei ? 'dragging' : '',
                  ]"
                  draggable="true"
                  @dragstart="startDragEvent(dateKey(day), ei)"
                  @dragend="dragOverDay = null">
                  <div class="flex-1">
                    <div class="font-semibold text-xs text-warm-600 mb-0.5">{{ event.time }}</div>
                    <div class="text-warm-800 text-sm font-medium">{{ event.title }}</div>
                    <div v-if="event.details" class="text-xs text-warm-600/70 mt-1">{{ event.details }}</div>
                  </div>
                  <button @click="removeEvent(dateKey(day), ei, event.id)"
                    class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-lg leading-none transition-all mt-0.5">
                    ×
                  </button>
                </div>
              </transition-group>
              <div v-if="eventsForDay(dateKey(day)).length === 0"
                class="text-warm-300 text-xs italic text-center py-1">
                Үйл явдал байхгүй
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- INDIVIDUAL TASKS -->
      <section class="mb-12">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">👤</span>
          <h2 class="font-serif text-3xl font-semibold">Хувийн даалгаврууд</h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- MARLAA -->
          <div class="bg-white border-2 border-warm-200 rounded-2xl shadow-sm overflow-hidden"
            style="border-top: 4px solid #d97757"
            @dragover.prevent="dragOverPerson = 'marlaa'"
            @dragleave="dragOverPerson = null"
            @drop="dropTask('marlaa')"
            :class="{ 'drag-over': dragOverPerson === 'marlaa' }">
            <div class="px-6 pt-6 pb-4">
              <div class="font-serif text-2xl font-bold text-marlaa mb-5">🌸 Марлаа</div>
              <div class="text-xs text-warm-600 mb-3">
                Дууссан: {{ tasks.marlaa.filter(t => t.done).length }} / {{ tasks.marlaa.length }}
                <span class="ml-2 inline-block h-1.5 rounded-full bg-warm-100 w-24 align-middle">
                  <span class="block h-1.5 rounded-full bg-marlaa transition-all"
                    :style="{ width: tasks.marlaa.length ? (tasks.marlaa.filter(t=>t.done).length / tasks.marlaa.length * 100) + '%' : '0%' }"></span>
                </span>
              </div>
              <transition-group name="fade" tag="ul" class="space-y-2">
                <li v-for="(task, ti) in tasks.marlaa" :key="task.id"
                  class="flex items-center gap-3 bg-warm-50 rounded-xl px-4 py-3 group cursor-grab active:cursor-grabbing transition-all hover:bg-warm-100"
                  :class="{ 'dragging': draggingTask && draggingTask.from === 'marlaa' && draggingTask.ti === ti }"
                  draggable="true"
                  @dragstart="startDragTask('marlaa', ti)"
                  @dragend="dragOverPerson = null">
                  <input type="checkbox"
                    :checked="task.done"
                    @change="toggleMarlaaTask(task, $event.target.checked)"
                    class="w-4 h-4 rounded accent-marlaa cursor-pointer flex-shrink-0" />
                  <span class="flex-1 text-sm transition-all" :class="task.done ? 'line-through text-warm-300' : ''">{{ task.text }}</span>
                  <button @click="removeMarlaaTask(task.id, ti)"
                    class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xl leading-none transition-all">
                    ×
                  </button>
                </li>
              </transition-group>
              <button @click="openAddTask('marlaa')"
                class="mt-4 w-full text-sm border-2 border-dashed border-marlaa/30 hover:border-marlaa/60 text-marlaa/60 hover:text-marlaa rounded-xl py-2.5 transition-all">
                + Даалгавар нэмэх
              </button>
            </div>
          </div>

          <!-- TSOGOO -->
          <div class="bg-white border-2 border-warm-200 rounded-2xl shadow-sm overflow-hidden"
            style="border-top: 4px solid #5b8c9f"
            @dragover.prevent="dragOverPerson = 'tsogoo'"
            @dragleave="dragOverPerson = null"
            @drop="dropTask('tsogoo')"
            :class="{ 'drag-over': dragOverPerson === 'tsogoo' }">
            <div class="px-6 pt-6 pb-4">
              <div class="font-serif text-2xl font-bold text-tsogoo mb-5">⚡ Цогоо</div>

              <div v-for="(group, gi) in tasks.tsogooGroups" :key="group.label + group.deadline" class="mb-5">
                <div v-if="group.deadline"
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold mb-3 border"
                  :class="deadlineClass(group.deadline)">
                  📅 {{ group.deadline }}: {{ deadlineLabel(group.deadline) }}
                </div>
                <div v-if="group.label" class="font-semibold text-sm text-warm-600 mb-2">{{ group.label }}</div>
                <transition-group name="fade" tag="ul" class="space-y-2">
                  <li v-for="(task, ti) in group.tasks" :key="task.id"
                    class="flex items-center gap-3 bg-warm-50 rounded-xl px-4 py-3 group cursor-grab active:cursor-grabbing transition-all hover:bg-warm-100"
                    draggable="true"
                    @dragstart="startDragTask('tsogoo', `${group.label}-${ti}`)"
                    @dragend="dragOverPerson = null">
                    <input type="checkbox"
                      :checked="task.done"
                      @change="toggleTsogooTask(gi, task, $event.target.checked)"
                      class="w-4 h-4 rounded accent-tsogoo cursor-pointer flex-shrink-0" />
                    <span class="flex-1 text-sm transition-all" :class="task.done ? 'line-through text-warm-300' : ''">{{ task.text }}</span>
                    <button @click="removeTsogooTask(gi, task.id, ti)"
                      class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xl leading-none transition-all">
                      ×
                    </button>
                  </li>
                </transition-group>
              </div>

              <div class="mt-4 bg-warm-50 rounded-xl px-4 py-3 text-sm">
                🎯 <strong>Өдөр бүр:</strong> 4-5 цаг суух (вэбсайт хөгжүүлэлт)
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SHARED TASKS -->
      <section class="mb-12">
        <div class="bg-gradient-to-br from-warm-100 to-white border-2 border-shared/30 rounded-2xl p-8 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <span class="text-2xl">🤝</span>
            <h2 class="font-serif text-3xl font-bold text-shared">Хамтдаа хийх даалгаврууд</h2>
            <button @click="openAddTask('shared')"
              class="ml-auto text-sm bg-shared text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-all shadow">
              + Нэмэх
            </button>
          </div>

          <transition-group name="fade" tag="div" class="space-y-3">
            <div v-for="(task, ti) in tasks.shared" :key="task.id"
              class="bg-white border border-warm-200 rounded-xl px-5 py-4 flex items-center gap-4 group shadow-sm hover:shadow transition-all"
              :class="{ 'opacity-60': task.done }">
              <input type="checkbox"
                :checked="task.done"
                @change="toggleSharedTask(task, $event.target.checked)"
                class="w-4 h-4 rounded accent-amber-700 cursor-pointer flex-shrink-0" />
              <div class="flex-1">
                <div v-if="task.deadline"
                  class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold mb-1 border"
                  :class="deadlineClass(task.deadline)">
                  📅 {{ task.deadline }} — {{ deadlineLabel(task.deadline) }}
                </div>
                <div class="text-sm font-medium" :class="task.done ? 'line-through text-warm-300' : ''">{{ task.text }}</div>
                <div v-if="task.sub" class="mt-2 space-y-1">
                  <div v-for="s in task.sub" :key="s" class="text-xs text-warm-600 flex items-start gap-1.5">
                    <span class="text-warm-300 mt-0.5">→</span> {{ s }}
                  </div>
                </div>
              </div>
              <button @click="removeSharedTask(task.id, ti)"
                class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xl leading-none transition-all">
                ×
              </button>
            </div>
          </transition-group>
        </div>
      </section>

      <!-- APP PROJECT -->
      <section class="mb-4">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-2xl">📱</span>
          <h2 class="font-serif text-3xl font-semibold">Гар утасны апп төсөл</h2>
        </div>
        <div class="grid gap-4">
          <div class="bg-white border border-warm-200 rounded-2xl p-6 shadow-sm">
            <div class="font-bold text-base mb-2">Апп зорилго</div>
            <p class="text-warm-600 text-sm leading-relaxed">Хэрэглэгч тухайн апп ашигласнаар тест өгч өөрт байх сэтгэл түгшил, хямрал, айдас, анхаарал дутмагшил зэргийг хянах автомат зөвөлгөө авах, шинэ соргог мэдээлэл унших боломж олгох.</p>
          </div>
          <div class="bg-white border border-warm-200 rounded-2xl p-6 shadow-sm">
            <div class="font-bold text-base mb-3">💰 Бизнес загвар</div>
            <ul class="text-sm text-warm-600 space-y-1.5">
              <li><strong>Загвар:</strong> Subscription — $15/сар</li>
              <li><strong>Зорилт:</strong> 1 жилд 12,000 тогтмол хэрэглэгч</li>
              <li><strong>Орлого:</strong> Podcast орлогоор зардал барих → 2 IT хөгжүүлэгч, 1 маркетер</li>
            </ul>
          </div>
        </div>
      </section>

    </div>

    <!-- MODAL: Add Event -->
    <transition name="fade">
      <div v-if="modal.addEvent" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="modal.addEvent = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 class="font-serif text-2xl font-bold mb-1">Үйл явдал нэмэх</h3>
          <p class="text-warm-600 text-sm mb-5">{{ modal.eventDateLabel }}</p>
          <div class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Цаг</label>
              <input v-model="newEvent.time" placeholder="жнь: 10:00 — 12:00"
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shared/30" />
            </div>
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Гарчиг</label>
              <input v-model="newEvent.title" placeholder="Үйл явдлын нэр"
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shared/30"
                @keyup.enter="confirmAddEvent" />
            </div>
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Дэлгэрэнгүй (заавал биш)</label>
              <textarea v-model="newEvent.details" placeholder="Нэмэлт мэдээлэл..."
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shared/30 resize-none" rows="2"></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="modal.addEvent = false" class="flex-1 border border-warm-200 rounded-xl py-2.5 text-sm text-warm-600 hover:bg-warm-50 transition-all">Болих</button>
            <button @click="confirmAddEvent" class="flex-1 bg-shared text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-700 transition-all">Нэмэх</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL: Add Task -->
    <transition name="fade">
      <div v-if="modal.addTask" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="modal.addTask = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 class="font-serif text-2xl font-bold mb-1">Даалгавар нэмэх</h3>
          <p class="text-warm-600 text-sm mb-5">
            <span v-if="modal.taskTarget === 'marlaa'" class="text-marlaa font-semibold">🌸 Марлаа</span>
            <span v-else-if="modal.taskTarget === 'tsogoo'" class="text-tsogoo font-semibold">⚡ Цогоо</span>
            <span v-else class="text-shared font-semibold">🤝 Хамтдаа</span>
          </p>
          <div class="space-y-3">
            <div>
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Даалгавар</label>
              <input v-model="newTask.text" placeholder="Даалгаврын агуулга..."
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shared/30"
                @keyup.enter="confirmAddTask" />
            </div>
            <div v-if="modal.taskTarget === 'shared'">
              <label class="text-xs font-semibold text-warm-600 uppercase tracking-wide mb-1 block">Эцсийн хугацаа (заавал биш)</label>
              <input v-model="newTask.deadline" type="date"
                class="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-shared/30" />
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="modal.addTask = false" class="flex-1 border border-warm-200 rounded-xl py-2.5 text-sm text-warm-600 hover:bg-warm-50 transition-all">Болих</button>
            <button @click="confirmAddTask" class="flex-1 bg-shared text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-amber-700 transition-all">Нэмэх</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { io } from 'socket.io-client'

// ── Socket initialization ─────────────────────────────────────────
const socket = io()

// ── API helper ────────────────────────────────────────────────────
async function api(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) console.error(`API ${method} ${path} →`, res.status)
  return res.json().catch(() => ({}))
}

// ── Date utilities ────────────────────────────────────────────────
const MN_DAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба']

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getMonday(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function parseDeadline(str) {
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return startOfDay(new Date(str))
  if (/^\d{2}-\d{2}$/.test(str)) {
    const [m, d] = str.split('-')
    return startOfDay(new Date(today.getFullYear(), +m - 1, +d))
  }
  if (/^\d{2}\/\d{2}$/.test(str)) {
    const [m, d] = str.split('/')
    return startOfDay(new Date(today.getFullYear(), +m - 1, +d))
  }
  return null
}

// ── Deadline styling ──────────────────────────────────────────────
function deadlineLabel(str) {
  const dl = parseDeadline(str)
  if (!dl) return ''
  const diff = Math.ceil((dl - today) / 86400000)
  if (diff < 0) return 'Хугацаа дууссан'
  if (diff === 0) return 'Өнөөдөр!'
  if (diff === 1) return 'Маргааш'
  return `${diff} өдөр үлдсэн`
}

function deadlineClass(str) {
  const dl = parseDeadline(str)
  if (!dl) return 'bg-warm-50 text-warm-600 border-warm-200'
  const diff = Math.ceil((dl - today) / 86400000)
  if (diff < 0)  return 'bg-red-50 text-red-600 border-red-200'
  if (diff <= 1) return 'bg-orange-50 text-orange-600 border-orange-200'
  if (diff <= 3) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-green-50 text-green-700 border-green-200'
}

// ── State ─────────────────────────────────────────────────────────
const loading = ref(true)
const today = startOfDay(new Date())
const weekStart = ref(getMonday(today))

const eventsByDate = reactive({})
const tasks = reactive({ marlaa: [], tsogooGroups: [], shared: [] })

function syncState(data) {
  Object.keys(eventsByDate).forEach(k => delete eventsByDate[k])
  Object.assign(eventsByDate, data.events || {})
  tasks.marlaa       = data.tasks?.marlaa       || []
  tasks.tsogooGroups = data.tasks?.tsogooGroups || []
  tasks.shared       = data.tasks?.shared       || []
}

onMounted(async () => {
  // Initial fetch for immediate display
  try {
    const data = await api('GET', '/state')
    syncState(data)
  } catch (e) {
    console.error('Failed to load initial state:', e)
  } finally {
    loading.value = false
  }

  // Listen for real-time updates from others
  socket.on('sync', data => {
    syncState(data)
  })
})

// ── Week computed ─────────────────────────────────────────────────
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
)

const weekEnd = computed(() => weekDays.value[6])

const weekRangeLabel = computed(() => {
  const s = weekDays.value[0]
  const e = weekEnd.value
  if (s.getMonth() === e.getMonth()) {
    return `${s.getFullYear()}/${s.getMonth() + 1}/${s.getDate()} — ${e.getDate()}`
  }
  return `${formatDisplay(s)} — ${formatDisplay(e)}, ${s.getFullYear()}`
})

const isCurrentWeek = computed(() => dateKey(weekStart.value) === dateKey(getMonday(today)))

function isToday(date) { return dateKey(date) === dateKey(today) }
function isPast(date)  { return startOfDay(date) < today }

function prevWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() - 7)
  weekStart.value = d
}
function nextWeek() {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 7)
  weekStart.value = d
}
function goToToday() { weekStart.value = getMonday(today) }

// ── Events ────────────────────────────────────────────────────────
function eventsForDay(key) {
  if (!eventsByDate[key]) eventsByDate[key] = []
  return eventsByDate[key]
}

async function removeEvent(dk, ei, eventId) {
  eventsForDay(dk).splice(ei, 1)
  await api('DELETE', `/events/${dk}/${eventId}`)
}

async function deleteDay(dk) {
  if (eventsByDate[dk] && eventsByDate[dk].length > 0) {
    if (!confirm('Энэ өдрийн бүх үйл явдлыг устгах уу?')) return
  }
  eventsByDate[dk] = []
  await api('DELETE', `/events/${dk}`)
}

// ── Drag & drop ───────────────────────────────────────────────────
const draggingEvent  = ref(null)
const draggingTask   = ref(null)
const dragOverDay    = ref(null)
const dragOverPerson = ref(null)

function startDragEvent(dk, ei) {
  const eventId = eventsForDay(dk)[ei]?.id
  draggingEvent.value = { dateKey: dk, ei, eventId }
}

async function dropEvent(targetKey) {
  if (!draggingEvent.value) return
  const { dateKey: srcKey, ei, eventId } = draggingEvent.value
  if (srcKey === targetKey) { draggingEvent.value = null; return }
  const [evt] = eventsForDay(srcKey).splice(ei, 1)
  eventsForDay(targetKey).push(evt)
  draggingEvent.value = null
  dragOverDay.value   = null
  await api('POST', '/events/move', { fromDate: srcKey, toDate: targetKey, eventId })
}

function startDragTask(from, ti) {
  draggingTask.value = { from, ti }
}

async function dropTask(target) {
  if (!draggingTask.value) return
  const { from, ti } = draggingTask.value
  if (from === target) { draggingTask.value = null; return }
  if (from === 'marlaa' && target === 'shared') {
    const [t] = tasks.marlaa.splice(ti, 1)
    tasks.shared.push({ ...t, deadline: null, sub: null })
    await api('POST', '/tasks/move', { fromList: 'marlaa', toList: 'shared', taskId: t.id })
  } else if (from === 'shared' && target === 'marlaa') {
    const [t] = tasks.shared.splice(ti, 1)
    tasks.marlaa.push(t)
    await api('POST', '/tasks/move', { fromList: 'shared', toList: 'marlaa', taskId: t.id })
  }
  draggingTask.value   = null
  dragOverPerson.value = null
}

// ── Modals ────────────────────────────────────────────────────────
const modal    = reactive({ addEvent: false, eventTargetKey: '', eventDateLabel: '', addTask: false, taskTarget: '' })
const newEvent = reactive({ time: '', title: '', details: '' })
const newTask  = reactive({ text: '', deadline: '' })

function openAddEvent(dk) {
  modal.eventTargetKey = dk
  const [y, m, d] = dk.split('-')
  const date = new Date(+y, +m - 1, +d)
  modal.eventDateLabel = `${formatDisplay(date)} — ${MN_DAYS[date.getDay()]}`
  newEvent.time = ''; newEvent.title = ''; newEvent.details = ''
  modal.addEvent = true
}

async function confirmAddEvent() {
  if (!newEvent.title.trim()) return
  const evt = {
    id:      crypto.randomUUID(),
    time:    newEvent.time.trim(),
    title:   newEvent.title.trim(),
    details: newEvent.details.trim(),
  }
  eventsForDay(modal.eventTargetKey).push(evt)
  modal.addEvent = false
  await api('POST', `/events/${modal.eventTargetKey}`, evt)
}

function openAddTask(target) {
  modal.taskTarget = target
  newTask.text = ''; newTask.deadline = ''
  modal.addTask = true
}

async function confirmAddTask() {
  if (!newTask.text.trim()) return
  const entry = { id: crypto.randomUUID(), text: newTask.text.trim(), done: false }
  if (modal.taskTarget === 'marlaa') {
    tasks.marlaa.push(entry)
    await api('POST', '/tasks/marlaa', entry)
  } else if (modal.taskTarget === 'shared') {
    const task = { ...entry, deadline: newTask.deadline || null, sub: null }
    tasks.shared.push(task)
    await api('POST', '/tasks/shared', task)
  }
  modal.addTask = false
}

// ── Task mutations ────────────────────────────────────────────────
async function toggleMarlaaTask(task, done) {
  task.done = done
  await api('PATCH', `/tasks/marlaa/${task.id}`, { done })
}

async function removeMarlaaTask(taskId, ti) {
  tasks.marlaa.splice(ti, 1)
  await api('DELETE', `/tasks/marlaa/${taskId}`)
}

async function toggleTsogooTask(gi, task, done) {
  task.done = done
  await api('PATCH', `/tasks/tsogoo/${gi}/${task.id}`, { done })
}

async function removeTsogooTask(gi, taskId, ti) {
  tasks.tsogooGroups[gi].tasks.splice(ti, 1)
  await api('DELETE', `/tasks/tsogoo/${gi}/${taskId}`)
}

async function toggleSharedTask(task, done) {
  task.done = done
  await api('PATCH', `/tasks/shared/${task.id}`, { done })
}

async function removeSharedTask(taskId, ti) {
  tasks.shared.splice(ti, 1)
  await api('DELETE', `/tasks/shared/${taskId}`)
}

// ── AI Scheduler ──────────────────────────────────────────────────
const aiPanel    = ref(false)
const aiPrompt   = ref('')
const aiApiKey   = ref(localStorage.getItem('calendarAiKey') || '')
const aiLoading  = ref(false)
const aiProposed = ref([])
const aiError    = ref('')

function saveApiKey() {
  localStorage.setItem('calendarAiKey', aiApiKey.value)
}

async function scheduleWithAI() {
  if (!aiPrompt.value.trim() || !aiApiKey.value.trim()) return
  aiLoading.value  = true
  aiProposed.value = []
  aiError.value    = ''
  try {
    const result = await api('POST', '/schedule', {
      prompt:        aiPrompt.value,
      apiKey:        aiApiKey.value,
      currentEvents: eventsByDate,
    })
    if (result.error) throw new Error(result.error)
    aiProposed.value = result.events || []
  } catch (e) {
    aiError.value = e.message || 'Алдаа гарлаа. API key шалгана уу.'
  } finally {
    aiLoading.value = false
  }
}

async function applyProposed() {
  for (const evt of aiProposed.value) {
    const event = {
      id:      crypto.randomUUID(),
      time:    evt.time    || '',
      title:   evt.title   || '',
      details: evt.details || '',
    }
    eventsForDay(evt.date).push(event)
    await api('POST', `/events/${evt.date}`, event)
  }
  aiProposed.value = []
  aiPrompt.value   = ''
}
</script>
