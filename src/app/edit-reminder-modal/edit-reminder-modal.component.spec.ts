import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditReminderModalComponent } from './edit-reminder-modal.component';

describe('EditReminderModalComponent', () => {
  let component: EditReminderModalComponent;
  let fixture: ComponentFixture<EditReminderModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [EditReminderModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditReminderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
