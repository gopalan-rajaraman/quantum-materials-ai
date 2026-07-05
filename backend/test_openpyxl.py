import openpyxl

def test_openpyxl():
    wb = openpyxl.load_workbook('../frontend/public/Thermal_CVD_Optimization_Report_Template.xlsx')
    ws = wb['Executive_Summary']
    ws['A2'] = 'Test Generation'
    wb.save('test_output.xlsx')
    print("Saved test_output.xlsx")

if __name__ == '__main__':
    test_openpyxl()
