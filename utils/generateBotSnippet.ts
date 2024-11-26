export function generateBotSnippet(workflowId: string): string {
  return `
<script>
  (function(w,d,s,o,f,js,fjs){
    w['SmartBotify']=o;w[o]=w[o]||function(){
    (w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','smartbotify','https://cdn.smartbotify.com/widget.js'));

  smartbotify('init', '${workflowId}');
</script>
<div id="smartbotify-widget"></div>
  `.trim()
}

