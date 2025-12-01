import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Password2DGridComponent } from '../password2d-grid.component';
import { By } from '@angular/platform-browser';

describe('Password2DGridComponent', () => {
  let component: Password2DGridComponent;
  let fixture: ComponentFixture<Password2DGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Password2DGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Password2DGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default options', () => {
    expect(component.engine.rows).toBe(2);
    expect(component.engine.cols).toBe(8);
  });

  it('should render the correct number of cells', () => {
    const cells = fixture.debugElement.queryAll(By.css('.border'));
    expect(cells.length).toBe(16);
  });

  it('should add a character on input', () => {
    const cell = fixture.debugElement.query(By.css('.border'));
    const event = new KeyboardEvent('keydown', { key: 'a' });
    cell.triggerEventHandler('keydown', event);
    fixture.detectChanges();

    expect(component.engine.grid[0][0]).toBe('a');
  });

  it('should delete a character on Backspace', () => {
    // First add a char
    component.engine.addChar(0, 0, 'a');
    fixture.detectChanges();
    expect(component.engine.grid[0][0]).toBe('a');

    const cell = fixture.debugElement.query(By.css('.border'));
    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    cell.triggerEventHandler('keydown', event);
    fixture.detectChanges();

    expect(component.engine.grid[0][0]).toBe('');
  });

  it('should toggle mask when button is clicked', () => {
    const button = fixture.debugElement.query(By.css('button.text-cyan-600'));
    expect(component.masked()).toBe(true);

    button.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.masked()).toBe(false);
  });

  it('should reset when reset button is clicked', () => {
    component.engine.addChar(0, 0, 'a');
    fixture.detectChanges();
    expect(component.engine.grid[0][0]).toBe('a');

    const button = fixture.debugElement.query(By.css('button.text-gray-600'));
    button.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.engine.grid[0][0]).toBe('');
  });

  it('should emit passwordChange on input', () => {
    const spy = jest.spyOn(component.passwordChange, 'emit');
    const cell = fixture.debugElement.query(By.css('.border'));
    const event = new KeyboardEvent('keydown', { key: 'a' });
    cell.triggerEventHandler('keydown', event);
    expect(spy).toHaveBeenCalled();
  });

  it('should preserve DOM elements when updating grid (trackBy)', () => {
    const cellsBefore = fixture.debugElement.queryAll(By.css('.border'));
    const firstCellElement = cellsBefore[0].nativeElement;

    // Update grid by adding a char
    const cell = fixture.debugElement.query(By.css('.border'));
    const event = new KeyboardEvent('keydown', { key: 'a' });
    cell.triggerEventHandler('keydown', event);
    fixture.detectChanges();

    const cellsAfter = fixture.debugElement.queryAll(By.css('.border'));
    const firstCellElementAfter = cellsAfter[0].nativeElement;

    // The element reference should be the same if trackBy is working
    expect(firstCellElement).toBe(firstCellElementAfter);
  });

  it('should have independent state for multiple instances', () => {
    const fixture2 = TestBed.createComponent(Password2DGridComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    // Add char to first component
    component.engine.addChar(0, 0, 'a');
    fixture.detectChanges();

    // Check first component
    expect(component.engine.grid[0][0]).toBe('a');

    // Check second component (should be empty)
    expect(component2.engine.grid[0][0]).toBe('');
  });

  it('Shift+Tab moves focus backward to previous cell', () => {
    const fixture2 = TestBed.createComponent(Password2DGridComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    // Focus second, Shift+Tab should move back to first
    const cells = fixture2.debugElement.queryAll(By.css('.border'));
    const firstCell = cells[0].nativeElement;
    const secondCell = cells[1].nativeElement;

    secondCell.focus();
    expect(document.activeElement).toBe(secondCell);

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
    });
    secondCell.dispatchEvent(shiftTabEvent);
    fixture2.detectChanges();
    
    expect(document.activeElement).toBe(firstCell);
      
    // Focus third, Shift+Tab should move back to second
    const thirdCell = cells[2].nativeElement;
    thirdCell.focus();
    expect(document.activeElement).toBe(thirdCell);

    thirdCell.dispatchEvent(shiftTabEvent);
    fixture2.detectChanges();

    expect(document.activeElement).toBe(secondCell);
  });
});
