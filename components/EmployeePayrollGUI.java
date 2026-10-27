
import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.ArrayList;

abstract class Employee {
    protected int id;
    protected String name;
    protected double basicSalary;

    public Employee(int id, String name, double basicSalary) {
        if (id <= 0 || name.trim().isEmpty() || basicSalary < 0) {
            throw new IllegalArgumentException(
                "Enter valid employee details.");
        }

        this.id = id;
        this.name = name;
        this.basicSalary = basicSalary;
    }

    public abstract double calculateSalary();

    public String getType() {
        return this instanceof PermanentEmployee
                ? "Permanent" : "Contract";
    }

    public String getDetails() {
        return id + " | " + name + " | " + getType()
                + " | Rs. "
                + String.format("%.2f", calculateSalary());
    }
}

class PermanentEmployee extends Employee {
    private double allowances;
    private double deductions;

    public PermanentEmployee(int id, String name,
            double basicSalary, double allowances,
            double deductions) {

        super(id, name, basicSalary);

        if (allowances < 0 || deductions < 0) {
            throw new IllegalArgumentException(
                "Allowances and deductions cannot be negative.");
        }

        this.allowances = allowances;
        this.deductions = deductions;
    }

    @Override
    public double calculateSalary() {
        return basicSalary + allowances - deductions;
    }
}

class ContractEmployee extends Employee {
    private double hoursWorked;
    private double hourlyRate;

    public ContractEmployee(int id, String name,
            double hoursWorked, double hourlyRate) {

        super(id, name, 0);

        if (hoursWorked < 0 || hourlyRate < 0) {
            throw new IllegalArgumentException(
                "Hours and hourly rate cannot be negative.");
        }

        this.hoursWorked = hoursWorked;
        this.hourlyRate = hourlyRate;
    }

    @Override
    public double calculateSalary() {
        return hoursWorked * hourlyRate;
    }
}

public class EmployeePayrollGUI extends JFrame {
    private JTextField idField, nameField, salaryField;
    private JTextField allowanceField, deductionField;
    private JTextField hoursField, rateField;

    private JComboBox<String> typeBox;
    private DefaultTableModel tableModel;
    private JTable table;

    private ArrayList<Employee> employees = new ArrayList<>();

    public EmployeePayrollGUI() {
        setTitle("Employee Payroll Management System");
        setSize(950, 600);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));

        JLabel heading = new JLabel(
            "EMPLOYEE PAYROLL MANAGEMENT SYSTEM",
            SwingConstants.CENTER);
        heading.setFont(new Font("Arial", Font.BOLD, 23));
        heading.setForeground(new Color(25, 75, 130));
        heading.setBorder(
            BorderFactory.createEmptyBorder(15, 5, 10, 5));

        add(heading, BorderLayout.NORTH);

        JPanel form = new JPanel(new GridLayout(0, 2, 8, 8));
        form.setBorder(BorderFactory.createTitledBorder(
            "Enter Employee Details"));

        idField = new JTextField();
        nameField = new JTextField();
        salaryField = new JTextField();
        allowanceField = new JTextField();
        deductionField = new JTextField();
        hoursField = new JTextField();
        rateField = new JTextField();

        typeBox = new JComboBox<>(
            new String[]{"Permanent", "Contract"});

        addField(form, "Employee ID:", idField);
        addField(form, "Employee Name:", nameField);
        addField(form, "Employee Type:", typeBox);
        addField(form, "Basic Salary (Permanent):", salaryField);
        addField(form, "Allowances:", allowanceField);
        addField(form, "Deductions:", deductionField);
        addField(form, "Hours Worked (Contract):", hoursField);
        addField(form, "Hourly Rate (Contract):", rateField);

        JButton addButton = new JButton("Add Employee");
        JButton clearButton = new JButton("Clear Fields");
        JButton deleteButton = new JButton("Delete Selected");
        JButton showButton = new JButton("Show Payroll");

        JPanel buttons = new JPanel(new GridLayout(2, 2, 8, 8));
        buttons.add(addButton);
        buttons.add(clearButton);
        buttons.add(deleteButton);
        buttons.add(showButton);

        JPanel leftPanel = new JPanel(new BorderLayout(8, 8));
        leftPanel.setBorder(
            BorderFactory.createEmptyBorder(5, 10, 10, 5));
        leftPanel.add(form, BorderLayout.CENTER);
        leftPanel.add(buttons, BorderLayout.SOUTH);
        leftPanel.setPreferredSize(new Dimension(360, 400));

        String[] columns = {
            "ID", "Name", "Type", "Calculated Salary (Rs.)"
        };

        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        table = new JTable(tableModel);
        table.setRowHeight(28);
        table.setFont(new Font("Arial", Font.PLAIN, 13));
        table.getTableHeader().setFont(
            new Font("Arial", Font.BOLD, 13));

        JPanel rightPanel = new JPanel(new BorderLayout(5, 5));
        rightPanel.setBorder(BorderFactory.createTitledBorder(
            "Employee Payroll Records"));
        rightPanel.add(new JScrollPane(table), BorderLayout.CENTER);

        add(leftPanel, BorderLayout.WEST);
        add(rightPanel, BorderLayout.CENTER);

        typeBox.addActionListener(e -> updateFields());
        addButton.addActionListener(e -> addEmployee());
        clearButton.addActionListener(e -> clearFields());
        deleteButton.addActionListener(e -> deleteEmployee());
        showButton.addActionListener(e -> showPayroll());

        updateFields();
        setVisible(true);
    }

    private void addField(JPanel panel, String label,
                          JComponent field) {
        panel.add(new JLabel(label));
        panel.add(field);
    }

    private void updateFields() {
        boolean permanent =
            typeBox.getSelectedItem().equals("Permanent");

        salaryField.setEnabled(permanent);
        allowanceField.setEnabled(permanent);
        deductionField.setEnabled(permanent);

        hoursField.setEnabled(!permanent);
        rateField.setEnabled(!permanent);
    }

    private double readNumber(JTextField field, String label) {
        double value = Double.parseDouble(
            field.getText().trim());

        if (!Double.isFinite(value) || value < 0) {
            throw new IllegalArgumentException(
                label + " must be a valid non-negative number.");
        }

        return value;
    }

    private void addEmployee() {
        try {
            int id = Integer.parseInt(idField.getText().trim());
            String name = nameField.getText().trim();

            if (id <= 0 || name.isEmpty()) {
                throw new IllegalArgumentException(
                    "Enter a valid ID and employee name.");
            }

            for (Employee employee : employees) {
                if (employee.id == id) {
                    throw new IllegalArgumentException(
                        "Employee ID already exists.");
                }
            }

            Employee employee;

            if (typeBox.getSelectedItem().equals("Permanent")) {
                double basic =
                    readNumber(salaryField, "Basic salary");
                double allowance =
                    readNumber(allowanceField, "Allowances");
                double deduction =
                    readNumber(deductionField, "Deductions");

                employee = new PermanentEmployee(
                    id, name, basic, allowance, deduction);
            } else {
                double hours =
                    readNumber(hoursField, "Hours worked");
                double rate =
                    readNumber(rateField, "Hourly rate");

                employee = new ContractEmployee(
                    id, name, hours, rate);
            }

            employees.add(employee);

            tableModel.addRow(new Object[]{
                employee.id,
                name,
                employee.getType(),
                String.format("%.2f", employee.calculateSalary())
            });

            JOptionPane.showMessageDialog(this,
                "Employee added successfully!\nCalculated Salary: Rs. "
                + String.format("%.2f",
                    employee.calculateSalary()));

            clearFields();

        } catch (NumberFormatException ex) {
            JOptionPane.showMessageDialog(this,
                "Please enter valid numeric values.",
                "Input Error", JOptionPane.ERROR_MESSAGE);
        } catch (IllegalArgumentException ex) {
            JOptionPane.showMessageDialog(this,
                ex.getMessage(), "Input Error",
                JOptionPane.ERROR_MESSAGE);
        }
    }

    private void deleteEmployee() {
        int selected = table.getSelectedRow();

        if (selected == -1) {
            JOptionPane.showMessageDialog(this,
                "Please select an employee to delete.");
            return;
        }

        employees.remove(selected);
        tableModel.removeRow(selected);
    }

    private void clearFields() {
        idField.setText("");
        nameField.setText("");
        salaryField.setText("");
        allowanceField.setText("");
        deductionField.setText("");
        hoursField.setText("");
        rateField.setText("");
        idField.requestFocus();
    }

    private void showPayroll() {
        if (employees.isEmpty()) {
            JOptionPane.showMessageDialog(this,
                "No employee records available.");
            return;
        }

        double total = 0;
        StringBuilder report = new StringBuilder(
            "EMPLOYEE PAYROLL REPORT\n\n");

        // Demonstrates runtime polymorphism.
        Employee[] employeeArray =
            employees.toArray(new Employee[0]);

        for (Employee employee : employeeArray) {
            double salary = employee.calculateSalary();
            total += salary;
            report.append(employee.getDetails()).append("\n");
        }

        report.append("\nTotal Payroll: Rs. ")
              .append(String.format("%.2f", total));

        JTextArea textArea = new JTextArea(
            report.toString(), 12, 45);
        textArea.setEditable(false);
        textArea.setFont(
            new Font("Monospaced", Font.PLAIN, 13));

        JOptionPane.showMessageDialog(this,
            new JScrollPane(textArea),
            "Payroll Report",
            JOptionPane.INFORMATION_MESSAGE);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(EmployeePayrollGUI::new);
    }
}
