import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CommonModule } from '@angular/common';
import { CurrentUser } from '../../../core/services/Services/current-user';
import { Lesson, SectionModel, SectionsResponse } from '../../Models/course-content.model';
import { CoursesService } from '../../../core/services/Services/course';
import { Section } from '../../../core/services/Services/section';
import { UserInfo } from '../../../core/services/Services/instractor-info';
import { UserInfoModel } from '../../Models/user-info.model';
type DeleteTarget =
  | { kind: 'section'; section: SectionModel }
  | { kind: 'lesson'; sectionId: number; lesson: Lesson };

@Component({
  selector: 'app-course-sidebar',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterLink,RouterLinkActive],
  templateUrl: './course-sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseSSidebar implements OnInit {
  private readonly courseService = inject(CoursesService);
  private readonly sectionService = inject(Section);
  private readonly router = inject(Router);
  private readonly currentUserService = inject(CurrentUser)
  private readonly insInfo = inject(UserInfo);
 
  // Input للـ courseId
  courseId = input.required<number>();
  isEnrolled=signal<boolean>(false)
  // Data Signals
  currentUser = signal<UserInfoModel | null>(null);
  sections = signal<SectionModel[]>([]);
  page = signal(1);
  perPage = signal(10);
  lessonsBySection = signal<Record<number, Lesson[]>>({});
  expandedSectionId = signal<number | null>(null);

  // Loading / Error States
  loadingSections = signal(true);
  loadingLessons = signal<number | null>(null);
  errorSections = signal(false);
  errorLessons = signal<number | null>(null);

  // UI Modals & Menus
  openMenu = signal<string | null>(null);
  showSectionModal = signal(false);
  editingSection = signal<SectionModel | null>(null);
  savingSection = signal(false);
  deleteTarget = signal<DeleteTarget | null>(null);
  deleting = signal(false);

    titleControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
  });

  // Computed Properties
  hasNextPage = computed(() => this.sections().length >= this.perPage());
  showPagination = computed(() => this.page() > 1 || this.hasNextPage());
  pages = computed(() => {
    const last = this.hasNextPage() ? this.page() + 1 : this.page();
    const first = Math.max(1, last - 4);
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  });

  loadedLessonsCount = computed(() => {
    const cache = this.lessonsBySection();
    return this.sections().reduce((total, s) => total + (cache[s.id]?.length ?? 0), 0);
  });

  deleteCopy = computed(() => {
    const target = this.deleteTarget();
    if (target?.kind === 'lesson') {
      return {
        title: 'حذف الدرس؟',
        message: 'هل أنت متأكد أنك تريد حذف هذا الدرس؟',
        hint: target.lesson.title,
      };
    }
    return {
      title: 'حذف القسم؟',
      message: 'هل أنت متأكد أنك تريد حذف هذا القسم؟',
      hint: 'قد يؤدي حذف القسم إلى حذف المحتوى المرتبط به.',
    };
  });

    ngOnInit(): void {
    this.loadSections(1);

  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenu.set(null);
    if (!this.savingSection()) this.closeSectionModal();
    if (!this.deleting()) this.deleteTarget.set(null);
  }

  toggleMenu(key: string, event: Event): void {
    event.stopPropagation();
    this.openMenu.update((current) => (current === key ? null : key));
  }

  // ---------- Sections Logic ----------
  loadSections(page: number): void {
    this.loadingSections.set(true);
    this.errorSections.set(false);
    this.courseService.getCouseSections(this.courseId(), page).subscribe({
      next: (res:SectionsResponse) => {
        if ((res.data.length === 0 && page > 1) || !res.data) {
          this.loadSections(page - 1);
          return;
        }
        this.sections.set(res.data);
        this.page.set(Number(res.pageNum) || page);
        this.perPage.set(res.sectionsPerPage);
        this.expandedSectionId.set(null);
        this.loadingSections.set(false);
        this.isEnrolled.set(res.isEnrolled)
        this.canAccess.set(res.canAccess)
console.log(this.isEnrolled(),this.canAccess());

      },
      error: () => {
        this.errorSections.set(true);
        this.loadingSections.set(false);
      },
    });
  }
  allow=computed(()=>{
    return this.isEnrolled();
  })
  allowAccess=computed(()=>{
    return this.canAccess();
  })
  goToPage(page: number): void {
    if (page < 1 || page === this.page() || this.loadingSections()) return;
    this.loadSections(page);
  }

  openAddSection(): void {
    this.editingSection.set(null);
    this.titleControl.reset('');
    this.showSectionModal.set(true);
  }

  goToLesson(lessonId: number,isPreview:boolean) {
    if(!this.canAccess()&&!this.allow()&&!isPreview) return;
  this.router.navigate([
    '/instractor/courses-content',
    this.courseId(),
    'lesson',
    this.courseId(),
    lessonId
  ]);
}

  openEditSection(section: SectionModel): void {
    this.editingSection.set(section);
    this.titleControl.reset(section.title);
    this.showSectionModal.set(true);
  }

  closeSectionModal(): void {
    this.showSectionModal.set(false);
  }

  submitSection(): void {
    if (this.titleControl.invalid) {
      this.titleControl.markAsTouched();
      return;
    }
    const title = this.titleControl.value.trim();
    const editing = this.editingSection();
    this.savingSection.set(true);
    const updatedSection = {
      title,
      order: editing?.order ?? this.sections().length + 1,
      courseId: Number(this.courseId()),
    };

    if (editing) {
      this.sectionService.updateSection(editing.id, updatedSection).subscribe({
        next: () => {
          this.sections.update((list) =>
            list.map((s) => (s.id === editing.id ? { ...s, title } : s)),
          );
          this.finishSaving();
        },
        error: () => this.savingSection.set(false),
      });
      return;
    }

    const sectionContent = {
      title,
      courseId: Number(this.courseId()),
      order: this.sections().length + 1,
    };
    console.log('Creating section with content:', sectionContent);

    this.sectionService.createSection(sectionContent).subscribe({
      next: (created) => {
        if (this.sections().length >= this.perPage()) {
          this.loadSections(this.page() + 1);
        } else {
          this.sections.update((list) => [...list, created]);
        }
        this.finishSaving();
      },
      error: (err) => {
        console.error('Error creating section:', err);
        this.savingSection.set(false);
      },
    });
  }

  private finishSaving(): void {
    this.savingSection.set(false);
    this.showSectionModal.set(false);
  }

  // ---------- Lessons Logic ----------
  toggleSection(section: SectionModel): void {
    if (this.expandedSectionId() === section.id) {
      this.expandedSectionId.set(null);
      return;
    }
    this.expandedSectionId.set(section.id);
    if (!this.lessonsBySection()[section.id]) {
      this.loadLessons(section.id);
    }
  }

  loadLessons(sectionId: number): void {
    this.loadingLessons.set(sectionId);
    this.errorLessons.set(null);
    this.sectionService.getSectionLessons(sectionId).subscribe({
      next: (lessons) => {
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        this.lessonsBySection.update((cache) => ({ ...cache, [sectionId]: sorted }));
        this.loadingLessons.set(null);
      },
      error: () => {
        this.errorLessons.set(sectionId);
        this.loadingLessons.set(null);
      },
    });
  }




  // ---------- Delete Logic ----------
  askDeleteSection(section: SectionModel): void {
    this.deleteTarget.set({ kind: 'section', section });
  }

  askDeleteLesson(sectionId: number, lesson: Lesson): void {
    this.deleteTarget.set({ kind: 'lesson', sectionId, lesson });
  }

  cancelDelete(): void {
    if (!this.deleting()) this.deleteTarget.set(null);
  }


    // التحقق من صلاحيات التعديل
    canAccess=signal<boolean>(false);
  

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);

    if (target.kind === 'section') {
      const id = target.section.id;
      this.sectionService.deleteSection(id).subscribe({
        next: () => {
          this.sections.update((list) => list.filter((s) => s.id !== id));
          this.lessonsBySection.update(({ [id]: _removed, ...rest }) => rest);
          if (this.expandedSectionId() === id) this.expandedSectionId.set(null);
          if (this.sections().length === 0 && this.page() > 1) this.loadSections(this.page() - 1);
          this.finishDelete();
        },
        error: () => this.deleting.set(false),
      });
      return;
    }

    const { sectionId, lesson } = target;
    this.sectionService.deleteLesson(lesson.id).subscribe({
      next: () => {
        this.lessonsBySection.update((cache) => ({
          ...cache,
          [sectionId]: (cache[sectionId] ?? []).filter((l) => l.id !== lesson.id),
        }));
        this.finishDelete();
      },
      error: () => this.deleting.set(false),
    });
  }

  private finishDelete(): void {
    this.deleting.set(false);
    this.deleteTarget.set(null);
  }
}