# -*- coding: utf-8 -*-
"""生成最小可用的 .xlsx 模板文件（inline string, 无第三方依赖）"""
import zipfile, os

CT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

WORKBOOK = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

WB_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>'''

def col_letter(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s

def cell(ref, v):
    return f'<c r="{ref}" t="inlineStr"><is><t xml:space="preserve">{v}</t></is></c>'

def sheet_xml(rows):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
           '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for r, row in enumerate(rows, 1):
        out.append(f'<row r="{r}">')
        for c, v in enumerate(row):
            if v is not None and str(v) != "":
                out.append(cell(f'{col_letter(c)}{r}', str(v)))
        out.append('</row>')
    out.append('</sheetData></worksheet>')
    return ''.join(out)

def write_xlsx(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('xl/workbook.xml', WORKBOOK)
        z.writestr('xl/_rels/workbook.xml.rels', WB_RELS)
        z.writestr('xl/worksheets/sheet1.xml', sheet_xml(rows))
    print('已生成', path)

base = os.path.dirname(os.path.abspath(__file__))
write_xlsx(os.path.join(base, 'public', 'templates', '用户导入模板.xlsx'), [
    ['用户id', '姓名', '密码', '角色(学生/教师/管理员或1/2/3)', '账号(可选,默认同id)', '学院(可选)'],
    ['B23010101', '张三', '123456', '学生', '', '通信与信息工程学院'],
    ['T002', '李老师', '123456', '教师', '', ''],
])
write_xlsx(os.path.join(base, 'public', 'templates', '班级导入模板.xlsx'), [
    ['班级id', '年份(可选,默认当前年)', '教师姓名(可选)'],
    ['B230101', '2023', '王增旭'],
    ['B230102', '', ''],
])
