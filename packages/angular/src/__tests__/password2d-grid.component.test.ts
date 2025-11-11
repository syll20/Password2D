import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Password2DGridComponent } from '../password2d-grid.component';
import { Password2DService } from '../password2d.service';

describe('Password2DGridComponent', () => {
  let component: Password2DGridComponent;
  let fixture: ComponentFixture<Password2DGridComponent>;
  let service: Password2DService;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Password2DGridComponent],
      providers: [Password2DService],
    }).compileComponents();

    fixture = TestBed.createComponent(Password2DGridComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(Password2DService);
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the service with options', () => {
    const initSpy = jest.spyOn(service, 'init');
    component.options = { rows: 2, cols: 2 };
    component.ngOnInit();
    expect(initSpy).toHaveBeenCalledWith({ rows: 2, cols: 2 });
  });

  it('should render the correct number of cells', () => {
    component.options = { rows: 2, cols: 8 };
    component.ngOnInit();
    fixture.detectChanges();
    const cells = compiled.querySelectorAll('.border');
    expect(cells.length).toBe(16);
  });

  it('should add a character on input', () => {
    const addCharSpy = jest.spyOn(service, 'addChar');
    const cell = compiled.querySelector('.border') as HTMLElement;
    cell.innerText = 'a';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
    expect(addCharSpy).toHaveBeenCalledWith(0, 0, 'a');
  });

  it('should delete a character on Backspace', () => {
    const deleteCharSpy = jest.spyOn(service, 'deleteChar');
    const cell = compiled.querySelector('.border') as HTMLElement;
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(deleteCharSpy).toHaveBeenCalledWith(0, 0);
  });

  it('should toggle mask when button is clicked', () => {
    const toggleMaskSpy = jest.spyOn(service, 'toggleMask');
    const button = compiled.querySelector('button') as HTMLElement;
    button.click();
    expect(toggleMaskSpy).toHaveBeenCalled();
  });

  it('should reset when reset button is clicked', () => {
    const resetSpy = jest.spyOn(service, 'reset');
    const buttons = compiled.querySelectorAll('button');
    const resetButton = buttons[1] as HTMLElement;
    resetButton.click();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('should emit passwordChange on input', () => {
    const emitSpy = jest.spyOn(component.passwordChange, 'emit');
    const cell = compiled.querySelector('.border') as HTMLElement;
    cell.innerText = 'a';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit passwordChange on delete', () => {
    const emitSpy = jest.spyOn(component.passwordChange, 'emit');
    const cell = compiled.querySelector('.border') as HTMLElement;
    cell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should emit passwordChange on reset', () => {
    const emitSpy = jest.spyOn(component.passwordChange, 'emit');
    const buttons = compiled.querySelectorAll('button');
    const resetButton = buttons[1] as HTMLElement;
    resetButton.click();
    expect(emitSpy).toHaveBeenCalledWith('');
  });
});
