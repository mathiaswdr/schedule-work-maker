export function scrollToSection(sectionId: string, offsetY?: number) {
    const section = document.getElementById(sectionId);
    if(!offsetY){
      offsetY = 0
    }

    if (section) {
      const y = section.getBoundingClientRect().top + window.pageYOffset + offsetY;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }


  export function truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
      return text;
    } else {
      return text.substring(0, maxLength).trim() + '...';
    }
  }


  export function formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-EN', options);
  }

  export const slugifyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');
  };
  

  // export function truncateText(text:string , maxLength: number) {
  //   if (text.length > maxLength) {
  //     return text.slice(0, maxLength) + '...';
  //   }
  //   return text;
  // }



  export function formatDateWithTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  }