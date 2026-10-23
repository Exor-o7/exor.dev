"""Build the text-based resume PDF from the site's verified career information.

Run with the bundled Python environment (reportlab required). Keep this concise
application copy aligned with resume.html when roles, dates, or skills change.
"""
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    HRFlowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output/pdf/conley-dannels-resume.pdf'
INK = colors.HexColor('#182631')
MUTED = colors.HexColor('#485866')
ACCENT = colors.HexColor('#245979')

body = ParagraphStyle('Body', fontName='Helvetica', fontSize=10.5, leading=14,
                      textColor=INK, spaceAfter=6, alignment=TA_LEFT)
summary = ParagraphStyle('Summary', parent=body, fontSize=10.5, leading=14.5, spaceAfter=8)
section = ParagraphStyle('Section', parent=body, fontName='Helvetica-Bold', fontSize=11,
                         leading=15, textColor=ACCENT, spaceBefore=11, spaceAfter=8,
                         keepWithNext=True)
role = ParagraphStyle('Role', parent=body, fontName='Helvetica-Bold', fontSize=11,
                      leading=14.5, spaceBefore=7, spaceAfter=3, keepWithNext=True)
meta = ParagraphStyle('Meta', parent=body, fontSize=10, leading=13, textColor=MUTED,
                      spaceAfter=6, keepWithNext=True)
bullet = ParagraphStyle('Bullet', parent=body, leftIndent=11, firstLineIndent=-9,
                        spaceAfter=4)
skill = ParagraphStyle('Skill', parent=body, fontSize=10, leading=14, spaceAfter=5)
name = ParagraphStyle('Name', parent=body, fontName='Helvetica-Bold', fontSize=26,
                      leading=30, spaceAfter=5)
headline = ParagraphStyle('Headline', parent=body, fontSize=12, leading=17,
                          textColor=ACCENT, spaceAfter=8)
contact = ParagraphStyle('Contact', parent=body, fontSize=10, leading=14, spaceAfter=3)


def p(text, style=body):
    return Paragraph(text, style)


def heading(text):
    return p(text.upper(), section)


def job(title, company_dates, bullets):
    # Keep a role heading, its metadata, and its first bullet together.
    result = [KeepTogether([p(escape(title), role), p(escape(company_dates), meta),
                           p('- ' + escape(bullets[0]), bullet)])]
    result += [p('- ' + escape(text), bullet) for text in bullets[1:]]
    return result


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D6DEE4'))
    canvas.line(44, 37, letter[0] - 44, 37)
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(MUTED)
    canvas.drawString(44, 23, 'Conley Dannels | exor.dev')
    canvas.drawRightString(letter[0] - 44, 23, f'{document.page} / 2')
    canvas.restoreState()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, rightMargin=44,
                            leftMargin=44, topMargin=39, bottomMargin=50,
                            title='Conley Dannels - Systems, Infrastructure & Automation',
                            author='Conley Dannels', subject='Professional resume',
                            pageCompression=1)
    story = [p('Conley Dannels', name),
             p('Systems | Infrastructure | Automation', headline),
             p('Big Spring, TX | <link href="mailto:conleydannels@gmail.com" color="#245979">conleydannels@gmail.com</link> | <link href="https://exor.dev" color="#245979">exor.dev</link>', contact),
             p('<link href="https://github.com/Exor-o7" color="#245979">github.com/Exor-o7</link> | <link href="https://www.linkedin.com/in/conleydannels/" color="#245979">linkedin.com/in/conleydannels</link>', contact),
             Spacer(1, 10), HRFlowable(width='100%', color=ACCENT, thickness=1),
             Spacer(1, 12),
             p('IT professional with over 15 years of experience in technical support, systems administration, and infrastructure. Works across cloud operations, endpoint lifecycle management, networking, and automation with Python, PowerShell, and Bash. Develops practical tools that consolidate support work and improve operational consistency.', summary),
             heading('Core skills')]
    for label, text in [
        ('Cloud & directory', 'Entra ID, Intune, Microsoft 365, SharePoint, Exchange, Apple Business Manager'),
        ('Systems & virtualization', 'Linux, Windows, macOS/iOS, VMware, Proxmox, TrueNAS, Nextcloud'),
        ('Networking', 'Cisco Firepower, switches/APs, UniFi, MPLS, OSPF, BGP, VPN, firewalls'),
        ('Scripting & tooling', 'Python, PowerShell, Bash, Visual Studio Code'),
        ('Operations', 'Endpoint imaging/provisioning, troubleshooting, VoIP, documentation, asset lifecycle'),
    ]:
        story.append(p(f'<b>{escape(label)}:</b> {escape(text)}', skill))
    story.append(heading('Professional experience'))
    story += job('Tech Support Tier 3 - Advanced Support & Internal Tools Development',
                 'Sorenson Communications (Remote) | May 2025 - Present', [
        'Lead troubleshooting for escalated issues across videophones, laptops, desktops, and tablets; investigate complex hardware, software, and interaction problems.',
        'Design and develop Internal Support Workspace, a Windows application built with Python and PySide6 to consolidate support workflows, emphasizing interface design, automation, reliability, and packaging.',
        'Work with engineering to document and reproduce technical scenarios and support projects that improve device reliability and backend workflows.',
    ])
    story += job('Tech Support Tier 2 - Device Support',
                 'Sorenson Communications (Remote) | September 2024 - April 2025', [
        'Provided advanced support for videophones, computers, tablets, and mobile devices, resolving configuration, connectivity, and performance issues.',
        'Created troubleshooting documentation that improved consistency for support teams.',
    ])
    story += job('System Administrator',
                 'Atkinson Aeronautics & Technology | March 2022 - March 2024', [
        'Managed Entra ID, Intune/Endpoint, Microsoft 365, SharePoint, Exchange, and communications platforms; provided multi-location remote support and oversaw IT assets for 66 employees.',
        'Designed and maintained Cisco Firepower and UniFi networks, plus TrueNAS, Proxmox, CUPS, Nextcloud, WireGuard VPN, and 3CX services.',
        'Developed Python and PowerShell tools for application deployment, one-click software management, and automated printer installation; maintained IT policies and procedures.',
    ])
    story.append(PageBreak())
    story += [p('Conley Dannels', role), p('Professional experience, continued', meta)]
    story += job('IT Equipment Coordinator', 'Amazon | October 2016 - February 2022', [
        'Managed receiving, deployment, ordering, auditing, and reconciliation of IT assets supporting 300-500 employees; troubleshot equipment and networks.',
        'Contributed to network lifecycle projects replacing Commodity switches with Cisco equipment, including rack builds with L3/L2 switches and UPS systems.',
        'Wrote standard operating procedures with troubleshooting guidance used across multiple Amazon IT sites within and outside the US.',
        'Coordinated projects and vendors with operations teams and contributed to a command center for monitoring activity and performance.',
    ])
    story += job('Computer Technician', 'Volunteer | January 2010 - October 2016', [
        'Provided residential and small-business technical support, including computer builds, operating system installation, malware remediation, and hardware repair.',
        'Planned, installed, and configured networks for over 40 customers; coordinated infrastructure installation and trained users on hardware and software.',
    ])
    story.append(heading('Selected project'))
    story += [p('Janitorfin - Jellyfin-native media cleanup plugin', role),
              p('C# / .NET 9 | <link href="https://github.com/Exor-o7/Janitorfin" color="#245979">github.com/Exor-o7/Janitorfin</link>', meta),
              p('- Developed a rules-driven cleanup workflow with a read-only preview, persistent pending queue, configurable review period, and separate scan and deletion tasks.', bullet),
              p('- Integrated optional Radarr and Sonarr monitoring updates with deletion behavior, and surfaced pending media through Jellyfin collections.', bullet)]
    story.append(heading('Education'))
    story += [p('<b>Howard College</b> - Associate of Science in Computer Science', body),
              p('Expected graduation: December 2027', body)]
    story.append(heading('Certification'))
    story.append(p('Cisco Certified Network Associate (CCNA) - issued January 2020', body))
    story.append(heading('Language'))
    story.append(p('American Sign Language (ASL) - Native', body))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f'Created {OUTPUT}')


if __name__ == '__main__':
    main()
